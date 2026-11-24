"""Edge event intake. Contract status: PROVISIONAL (see contracts/edge-events/v1)."""

import json
import logging
from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.deps import get_session, get_settings_dep
from app.api.errors import error_response
from app.api.v1.edge.device_auth import authenticated_device
from app.core.config import Settings
from app.modules.cvintake.service import (
    CHANNEL,
    DeviceContext,
    ingest_edge_batch,
    summarize,
)
from app.modules.eventstore.service import find_sequence_gaps, quarantine

logger = logging.getLogger("rada.edge")
router = APIRouter(prefix="/edge", tags=["edge"])


def _batch_events(body: Any) -> list[Any] | None:
    if isinstance(body, dict) and set(body) == {"events"} and isinstance(body["events"], list):
        return body["events"]
    return None


@router.post("/events")
async def ingest_events(
    request: Request,
    device: Annotated[DeviceContext, Depends(authenticated_device)],
    session: Annotated[Session, Depends(get_session)],
    settings: Annotated[Settings, Depends(get_settings_dep)],
) -> JSONResponse:
    received_at = datetime.now(UTC)
    raw = await request.body()
    try:
        body: Any = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError):
        body = {"_unparseable_body": raw.decode("utf-8", errors="replace")[:65536]}
    events = _batch_events(body)

    if events is None:
        quarantine_id = quarantine(
            session,
            channel=CHANNEL,
            reason="invalid_batch",
            errors=['body must be a JSON object of the form {"events": [...]}'],
            body=body,
            received_at=received_at,
            source_instance=device.source_instance,
        )
        session.commit()
        return error_response(
            422,
            "invalid_batch",
            "The batch body is not valid.",
            {"quarantine_id": str(quarantine_id)},
        )
    if not events:
        return error_response(422, "empty_batch", "The batch contains no events.")
    if len(events) > settings.edge_max_batch_size:
        return error_response(
            413,
            "batch_too_large",
            "Split the batch and retry.",
            {"max_batch_size": settings.edge_max_batch_size},
        )

    try:
        outcomes = ingest_edge_batch(session, device, events, received_at=received_at)
        session.commit()
    except SQLAlchemyError:
        session.rollback()
        logger.exception("edge_batch_not_persisted", extra={"source": device.source_instance})
        return error_response(503, "not_persisted", "Events were not stored; retry the batch.")

    summary = summarize(outcomes)
    logger.info("edge_batch_persisted", extra={"source": device.source_instance, **summary})
    return JSONResponse(
        {
            "received_at": received_at.isoformat(),
            "summary": summary,
            "results": [
                {
                    "index": o.index,
                    "event_id": o.event_id,
                    "source_instance": o.source_instance,
                    "status": o.status,
                    "reason": o.reason,
                    "quarantine_id": str(o.quarantine_id) if o.quarantine_id else None,
                }
                for o in outcomes
            ],
        }
    )


@router.get("/sequence-gaps")
def sequence_gaps(
    device: Annotated[DeviceContext, Depends(authenticated_device)],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    gaps = find_sequence_gaps(session, device.source_instance)
    return {
        "source_instance": device.source_instance,
        "gaps": [{"first_missing": g.first_missing, "last_missing": g.last_missing} for g in gaps],
    }
