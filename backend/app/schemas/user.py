from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    name: str | None = Field(None, max_length=100)


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
