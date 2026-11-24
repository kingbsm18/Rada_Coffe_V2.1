import json
import logging

from app.core.logging import JsonFormatter, request_id_var


def test_json_formatter_includes_extra_fields_and_request_id() -> None:
    record = logging.makeLogRecord(
        {"name": "rada.test", "levelname": "INFO", "msg": "hello", "source": "edge-01"}
    )
    token = request_id_var.set("req-123")
    try:
        entry = json.loads(JsonFormatter().format(record))
    finally:
        request_id_var.reset(token)
    assert entry["message"] == "hello"
    assert entry["source"] == "edge-01"
    assert entry["request_id"] == "req-123"
    assert entry["level"] == "INFO"
