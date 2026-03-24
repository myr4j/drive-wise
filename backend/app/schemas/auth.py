from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional


class DriverRegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="email du chauffeur")
    username: str = Field(..., min_length=3, max_length=100, description="nom d'utilisateur")
    password: str = Field(..., min_length=6, description="mot de passe (min 6 caractères)")


class DriverLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="email du chauffeur")
    password: str = Field(..., description="mot de passe")


class DriverResponse(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class DriverLoginResponse(BaseModel):
    driver: DriverResponse
    message: str = "connexion réussie"
