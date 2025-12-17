from pydantic import BaseModel, EmailStr, Field
from datetime import date
from typing import Optional

class ItemUpdate(BaseModel):
    name: Optional[str] = None

class FavoriteUpdate(BaseModel):
    favorite: bool

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=64)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserMe(BaseModel):
    id: int
    email: EmailStr

class ItemCreate(BaseModel):
    name: str
    storage: str = "fridge"
    expiry_date: date

class ItemOut(BaseModel):
    id: int
    name: str
    storage: str
    expiry_date: date

    class Config:
        from_attributes = True
