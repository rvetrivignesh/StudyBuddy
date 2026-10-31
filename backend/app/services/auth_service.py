from app.core.errors import ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.db.repositories import UserRepository
from app.schemas.user import Token, UserCreate


class AuthService:
    def __init__(self, db):
        self.users = UserRepository(db)

    async def register(self, body: UserCreate) -> Token:
        email = body.email.lower()
        if await self.users.get_by_email(email):
            raise ConflictError("Email already registered")
        user = await self.users.insert({"email": email, "name": body.name, "password_hash": hash_password(body.password)})
        return Token(access_token=create_access_token(user["id"]))

    async def login(self, email: str, password: str) -> Token:
        user = await self.users.get_by_email(email)
        if not user or not verify_password(password, user["password_hash"]):
            raise UnauthorizedError("Incorrect email or password")
        return Token(access_token=create_access_token(user["id"]))
