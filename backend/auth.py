import os
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

APP_PASSWORD = os.environ.get("APP_PASSWORD", "")

# RFC 1918 private ranges + localhost
_PRIVATE_PREFIXES = (
    "127.", "::1", "10.", "192.168.",
    # 172.16.0.0/12
    *[f"172.{i}." for i in range(16, 32)],
)


def _is_local(ip: str) -> bool:
    return any(ip.startswith(p) for p in _PRIVATE_PREFIXES)


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not APP_PASSWORD:
            return await call_next(request)

        # Always allow health check
        if request.url.path == "/health":
            return await call_next(request)

        # Prefer X-Forwarded-For / X-Real-IP set by reverse proxies (e.g. NPM)
        forwarded_for = request.headers.get("X-Forwarded-For")
        real_ip = request.headers.get("X-Real-IP")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        elif real_ip:
            client_ip = real_ip.strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        if _is_local(client_ip):
            return await call_next(request)

        password = request.headers.get("X-Password", "")
        if password != APP_PASSWORD:
            return JSONResponse({"detail": "Unauthorized"}, status_code=401)

        return await call_next(request)
