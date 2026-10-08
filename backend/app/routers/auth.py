from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User
from backend.app.schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from backend.app.auth_utils import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    user = User(
        email=user_in.email.lower(),
        name=user_in.name or user_in.email.split("@")[0].capitalize(),
        hashed_password=get_password_hash(user_in.password),
        onboarding_completed=bool(user_in.preferred_categories and len(user_in.preferred_categories) > 0)
    )
    if user_in.preferred_categories:
        user.set_preferred_categories(user_in.preferred_categories)

    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "preferred_categories": user.get_preferred_categories(),
            "onboarding_completed": user.onboarding_completed,
            "created_at": user.created_at
        }
    }


@router.post("/login", response_model=TokenResponse)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "preferred_categories": user.get_preferred_categories(),
            "onboarding_completed": user.onboarding_completed,
            "created_at": user.created_at
        }
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "preferred_categories": current_user.get_preferred_categories(),
        "onboarding_completed": current_user.onboarding_completed,
        "created_at": current_user.created_at
    }
