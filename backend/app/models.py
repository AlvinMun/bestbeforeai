from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from .db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=False)
    storage = Column(String, nullable=False)
    expiry_date = Column(Date, nullable=False)
    favorite = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())