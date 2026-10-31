"""Domain errors. Services raise these; main.py maps them to HTTP responses."""


class AppError(Exception):
    status_code = 400

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFoundError(AppError):
    status_code = 404


class ConflictError(AppError):
    status_code = 409


class UnauthorizedError(AppError):
    status_code = 401


class ValidationFailed(AppError):
    status_code = 422


class NotImplementedFeature(AppError):
    status_code = 501


class UpstreamError(AppError):
    """An LLM / vector-store / external service failed."""

    status_code = 502
