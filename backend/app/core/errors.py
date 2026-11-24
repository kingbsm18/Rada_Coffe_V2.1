from typing import Any


class AppError(Exception):
    """Domain-level error translated to an HTTP response by the API layer."""

    def __init__(
        self, code: str, message: str, *, status_code: int = 400, details: Any = None
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
