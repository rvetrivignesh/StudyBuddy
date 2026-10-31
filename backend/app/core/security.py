from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings


def _pw(password: str) -> bytes:
    return password.encode("utf-8")[:72]  # bcrypt ignores/rejects bytes beyond 72


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_pw(password), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_pw(password), hashed.encode())
    except ValueError:
        return False


def create_access_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode({"sub": user_id, "exp": exp}, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None
