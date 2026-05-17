from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.services.auth import authenticate_driver, create_driver
from app.models.driver import Driver
from app.schemas.auth import (
    DriverRegisterRequest,
    DriverLoginRequest,
    DriverResponse,
    DriverLoginResponse,
    PasswordResetRequest,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=DriverResponse, status_code=201)
def register(payload: DriverRegisterRequest, db: Session = Depends(get_db)):
    try:
        driver = create_driver(
            db=db,
            email=payload.email,
            username=payload.username,
            password=payload.password,
        )
        return driver
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=DriverLoginResponse)
def login(payload: DriverLoginRequest, db: Session = Depends(get_db)):
    driver = authenticate_driver(
        db=db,
        email=payload.email,
        password=payload.password,
    )
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    return DriverLoginResponse(
        driver=DriverResponse(
            id=driver.id,
            email=driver.email,
            username=driver.username,
            is_active=driver.is_active,
            created_at=driver.created_at,
        ),
        message="connexion réussie",
    )


@router.post("/reset-password")
def reset_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.email == payload.email).first()
    if not driver:
        # don't reveal whether email exists
        return {"message": "Si l'email existe, le mot de passe a été mis à jour"}
    driver.hashed_password = Driver.hash_password(payload.password)
    db.add(driver)
    db.commit()
    return {"message": "mot de passe mis à jour"}
