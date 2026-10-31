from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import auth_service, get_current_user
from app.schemas.user import Token, UserCreate, UserPublic
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=201)
async def register(body: UserCreate, svc: AuthService = Depends(auth_service)):
    return await svc.register(body)


@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends(), svc: AuthService = Depends(auth_service)):
    """`username` is the account email (OAuth2 form field name)."""
    return await svc.login(form.username, form.password)


@router.get("/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    return user
