import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.errors import AppError
from app.core.logging import request_id_var

logger = logging.getLogger("rada.api")


def error_response(status_code: int, code: str, message: str, details: Any = None) -> JSONResponse:
    body = {
        "code": code,
        "message": message,
        "details": details,
        "request_id": request_id_var.get(),
    }
    return JSONResponse(status_code=status_code, content=body)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, error: AppError) -> JSONResponse:
        return error_response(error.status_code, error.code, error.message, error.details)

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, error: RequestValidationError) -> JSONResponse:
        details = [
            {"loc": list(item.get("loc", ())), "msg": item.get("msg"), "type": item.get("type")}
            for item in error.errors()
        ]
        return error_response(
            422, "validation_error", "The request contains invalid fields.", details
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, error: StarletteHTTPException) -> JSONResponse:
        code = "not_found" if error.status_code == 404 else f"http_{error.status_code}"
        return error_response(error.status_code, code, str(error.detail))

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, error: Exception) -> JSONResponse:
        logger.exception("unhandled_error", extra={"error_type": type(error).__name__})
        return error_response(500, "internal_error", "An unexpected error occurred.")
