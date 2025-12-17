from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi import UploadFile, File
from PIL import Image
import pytesseract
import io


from .db import Base, engine
from .models import User
from .schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserMe,
    ItemCreate,
    ItemOut,
    ItemUpdate,
    FavoriteUpdate,
)
from .auth import get_db, hash_password, verify_password, create_access_token, get_current_user
from .models import Item
from datetime import date
from .expiry import extract_expiry


Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/auth/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token)

@app.post("/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.id)
    return TokenResponse(access_token=token)

@app.get("/auth/me", response_model=UserMe)
def me(current_user=Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email}

@app.post("/items", response_model=ItemOut)
def create_item(
    payload: ItemCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    item = Item(
        user_id=current_user.id,
        name=payload.name,
        storage=payload.storage,
        expiry_date=payload.expiry_date,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.get("/items", response_model=list[ItemOut])
def list_items(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Item).filter(Item.user_id == current_user.id).all()

@app.put("/items/{item_id}")
def update_item(
    item_id: int,
    payload: ItemUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if payload.name is not None:
        item.name = payload.name

    db.commit()
    db.refresh(item)
    return item

@app.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
    return {"ok": True}

@app.patch("/items/{item_id}/favorite")
def set_favorite(
    item_id: int,
    payload: FavoriteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(Item)
        .filter(Item.id == item_id, Item.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.favorite = payload.favorite
    db.commit()
    db.refresh(item)
    return item


@app.post("/ocr")
def ocr_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    image_bytes = file.file.read()
    image = Image.open(io.BytesIO(image_bytes))

    text = pytesseract.image_to_string(image)

    result = extract_expiry(text)

    return {
        "filename": file.filename,
        "text": text,
        "expiry": result,
    }

@app.post("/ocr/add-item")
def ocr_add_item(
    name: str,
    expiry_date: date,
    storage: str = "fridge",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    item = Item(
        user_id=current_user.id,
        name=name,
        storage=storage,
        expiry_date=expiry_date,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

