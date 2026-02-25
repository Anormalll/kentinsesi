import sys
import os

# Backend klasörünü path'e ekle (Import hatasını çözer)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
# --- DÜZELTME BURADA: 'func' EKLENDİ ---
from sqlalchemy import text, func
# ---------------------------------------
from typing import List
import shutil
import uuid

from database import SessionLocal, engine, Base
import models, schemas
from fastapi.security import OAuth2PasswordRequestForm
import auth

# Klasör yoksa oluştur
if not os.path.exists("uploads"):
    os.makedirs("uploads")

# Tabloları oluştur
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS Ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resimlerin görünmesi için klasörü dışarı aç
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Veritabanı Oturumu
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- DB FIX ENDPOINT (Sütunları Kontrol Et) ---
@app.get("/fix_db")
def fix_database(db: Session = Depends(get_db)):
    try:
        try:
            db.execute(text("ALTER TABLE complaints ADD COLUMN lat FLOAT"))
        except:
            pass
        try:
            db.execute(text("ALTER TABLE complaints ADD COLUMN lng FLOAT"))
        except:
            pass
        try:
            db.execute(text("ALTER TABLE complaints ADD COLUMN user_identifier VARCHAR"))
        except:
            pass

        db.commit()
        return {"message": "Veritabanı güncel (lat, lng, user_identifier)."}
    except Exception as e:
        return {"message": str(e)}


# --- RANKING (SIRALAMA) ENDPOINT ---
@app.get("/rank/{user_identifier}")
def get_user_rank(user_identifier: str, db: Session = Depends(get_db)):
    # 1. Kullanıcıları bildirim sayısına göre grupla
    results = db.query(
        models.Complaint.user_identifier,
        func.count(models.Complaint.id).label('count')
    ).group_by(models.Complaint.user_identifier).all()

    # 2. Listeyi çoktan aza sırala
    sorted_users = sorted(
        [r for r in results if r.user_identifier],
        key=lambda x: x.count,
        reverse=True
    )

    # 3. Senin sıranı bul
    my_rank = 0
    total_users = len(sorted_users)

    for index, user in enumerate(sorted_users):
        if user.user_identifier == user_identifier:
            my_rank = index + 1
            break

    if my_rank == 0:
        my_rank = total_users + 1

    return {"rank": my_rank, "total_users": total_users}


# --- RESİM YÜKLEME ---
@app.post("/upload/")
async def upload_image(request: Request, file: UploadFile = File(...)):
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_location = f"uploads/{unique_filename}"

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Tam URL döndür (Örn: https://site.com/uploads/resim.jpg)
    return {"url": str(request.base_url) + file_location}


# --- CRUD ENDPOINTLERİ ---

@app.post("/complaints/", response_model=schemas.Complaint)
def create_complaint(complaint: schemas.ComplaintCreate, db: Session = Depends(get_db)):
    db_complaint = models.Complaint(**complaint.dict())
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


@app.get("/complaints/", response_model=List[schemas.Complaint])
def read_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    complaints = db.query(models.Complaint).order_by(models.Complaint.created_at.desc()).offset(skip).limit(limit).all()
    return complaints


@app.put("/complaints/{complaint_id}/status", response_model=schemas.Complaint)
def update_complaint_status(complaint_id: int, status_update: schemas.ComplaintStatusUpdate,
                            db: Session = Depends(get_db)):
    db_complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    db_complaint.status = status_update.status
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


@app.delete("/complaints/{complaint_id}")
def delete_complaint(complaint_id: int, db: Session = Depends(get_db)):
    db_complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    db.delete(db_complaint)
    db.commit()
    return {"message": "Complaint deleted"}


# --- ARAÇ ENDPOINTLERİ ---

@app.post("/vehicles/", response_model=schemas.Vehicle)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db)):
    db_vehicle = models.Vehicle(**vehicle.dict())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


@app.get("/vehicles/", response_model=List[schemas.Vehicle])
def read_vehicles(db: Session = Depends(get_db)):
    return db.query(models.Vehicle).all()


@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(vehicle)
    db.commit()
    return {"message": "Vehicle deleted"}

# --- MEVCUT IMPORTLARIN ALTINA, EN SONA EKLE ---

@app.get("/reset_db")
def reset_database():
    try:
        # Tüm tabloları sil
        Base.metadata.drop_all(bind=engine)
        # Tabloları modellerdeki en güncel haliyle tekrar oluştur
        Base.metadata.create_all(bind=engine)
        return {"message": "Veritabanı tamamen sıfırlandı ve tüm sütunlar (user_identifier dahil) eklendi!"}
    except Exception as e:
        return {"message": f"Hata: {str(e)}"}


# --- AUTH (KAYIT VE GİRİŞ) ENDPOINTLERİ ---

@app.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Email daha önce alınmış mı kontrol et
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu email adresi zaten kullanımda.")

    # Şifreyi hashle ve kaydet
    hashed_pwd = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_pwd,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/login", response_model=schemas.Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Kullanıcıyı bul
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    # Email veya şifre yanlışsa
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı.")

    # Başarılıysa Token oluştur ve gönder
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}