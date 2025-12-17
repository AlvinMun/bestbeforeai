# BestBefore AI

This is a smart food expiry tracking web application that helps users reduce food waste by tracking expiry dates, detecting expiring items, and automatically extracting expiry information from product images using OCR.

---

## Features

- 🔐 **User Authentication**
  - Register & Login with JWT-based authentication

- 📊 **Dashboard Overview**
  - Total items
  - Safe items
  - Expiring soon
  - Expired items

- 🧾 **Item Management**
  - Add items manually
  - Edit item details
  - Delete items
  - Mark items as **Favorites**

- ⭐ **Favorites**
  - Star important items
  - Filter favorites instantly

- 🔍 **Search**
  - Real-time item search by name

- **OCR Expiry Detection**
  - Upload product images
  - Automatically detect expiry dates using OCR
  - Auto-fill expiry date when adding items

---

## Demo

> *(Screenshots will be added here)*

### Landing Page
<!-- Add screenshot here -->
![Landing Page](screenshots/landing.png)

### Login Page
<!-- Add screenshot here -->
![Login Page](screenshots/login.png)

### Dashboard
<!-- Add screenshot here -->
![Dashboard](screenshots/dashboard.png)

### Add Item + OCR Upload
<!-- Add screenshot here -->
![Add Item OCR](screenshots/add-item-ocr.png)

### Favorites View
<!-- Add screenshot here -->
![Favorites](screenshots/favorites.png)

---

## Tech Stack

### Frontend
- React (Vite)
- React Router
- Axios
- CSS (Custom UI, Dark Theme)

### Backend
- FastAPI
- SQLAlchemy
- SQLite
- JWT Authentication

### OCR
- Tesseract OCR
- Python image processing

---

## Project Structure

```text
bestbeforeai/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── routes/
│   │   ├── auth/
│   │   └── db.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
│
└── README.md
```
## Setup Instructions:
Backend:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
Backend runs at:
```arduino
http://localhost:8000
```
Swagger docs:
```bash
http://localhost:8000/docs
```
Frontend:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at:
```arduino
http://localhost:5173
```
## Environment Notes
JWT tokens are stored in localStorage

OCR requires Tesseract OCR installed and added to PATH

SQLite database is auto-created on backend startup

## Author
Alvin Mun

## License
This project is licensed under the MIT License.
