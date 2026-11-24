"""Edge device authentication: PROVISIONAL and development-only.

The device credential lifecycle is unresolved (Domain 3 / Edge Runtime documents). Outside
development and test every edge request is refused until an approved resolver replaces this one.
"""

import hashlib
import hmac
import json
import uuid
from typing import Annotated, Protocol

from fastapi import Header, Request
from pydantic import BaseModel, ConfigDict, TypeAdapter

from app.core.config import Settings
from app.core.errors import AppError
from app.modules.cvintake.service import DeviceContext

DEVICE_KEY_HEADER = "X-RADA-Device-Key"


class DeviceResolver(Protocol):
    def resolve(self, presented_key: str) -> DeviceContext | None: ...


class _DevDevice(BaseModel):
    model_config = ConfigDict(extra="forbid")
    key_sha256: str
    tenant_id: uuid.UUID
    establishment_id: uuid.UUID
    source_instance: str


class StaticDevDeviceResolver:
    def __init__(self, devices: list[_DevDevice]) -> None:
        self._devices = devices

    @classmethod
    def from_json(cls, raw: str) -> "StaticDevDeviceResolver":
        devices = TypeAdapter(list[_DevDevice]).validate_python(json.loads(raw)) if raw else []
        return cls(devices)

    def resolve(self, presented_key: str) -> DeviceContext | None:
        presented = hashlib.sha256(presented_key.encode()).hexdigest()
        for device in self._devices:
            if hmac.compare_digest(presented, device.key_sha256.lower()):
                return DeviceContext(
                    device.tenant_id, device.establishment_id, device.source_instance
                )
        return None


class UnavailableDeviceResolver:
    def resolve(self, presented_key: str) -> DeviceContext | None:
        raise AppError(
            "edge_authentication_unavailable",
            "Edge device authentication is not configured for this environment.",
            status_code=503,
        )


def build_device_resolver(settings: Settings) -> DeviceResolver:
    if settings.is_development:
        return StaticDevDeviceResolver.from_json(settings.edge_dev_devices)
    return UnavailableDeviceResolver()


def authenticated_device(
    request: Request,
    device_key: Annotated[str | None, Header(alias=DEVICE_KEY_HEADER)] = None,
) -> DeviceContext:
    resolver: DeviceResolver = request.app.state.device_resolver
    if not device_key:
        raise AppError("unauthorized", "A device credential is required.", status_code=401)
    device = resolver.resolve(device_key)
    if device is None:
        raise AppError("unauthorized", "The device credential is not valid.", status_code=401)
    return device
