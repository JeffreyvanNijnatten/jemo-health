import os
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

APP_PASSWORD = os.environ.get("APP_PASSWORD", "")


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if not APP_PASSWORD:
            return await call_next(request)

        if request.url.path == "/health":
            return await call_next(request)

        if request.headers.get("X-Password", "") != APP_PASSWORD:
            return JSONResponse({"detail": "Unauthorized"}, status_code=401)

        return await call_next(request)
