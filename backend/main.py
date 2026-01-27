import shutil
import os
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # <-- Resimler için kritik
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, database

# Veritabanı tablolarını oluştur
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# --- 1. RESİM KLASÖRÜ AYARI (Resimlerin görünmesi için şart) ---
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# "uploads" klasörünü dünyaya açıyoruz. Artık http://.../uploads/resim.jpg çalışacak.
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- CORS AYARLARI ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tüm IP'lere izin ver (APK ve Localhost için)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- ENDPOINTLER ---

@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    # Dosya ismindeki boşlukları temizle
    safe_filename = file.filename.replace(" ", "_")
    file_location = f"{UPLOAD_DIR}/{safe_filename}"

    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    # Frontend'e resmin tam adresini dön (IP adresine gerek yok, localhost yeterli şimdilik)
    base_url = "https://kentsesi-backend.onrender.com"
    return {"url": f"{base_url}/uploads/{safe_filename}"}


@app.post("/complaints/", response_model=schemas.ComplaintOut)
def create_complaint(complaint: schemas.ComplaintCreate, db: Session = Depends(database.get_db)):
    db_complaint = models.Complaint(**complaint.dict())
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


@app.get("/complaints/", response_model=List[schemas.ComplaintOut])
def read_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    complaints = db.query(models.Complaint).order_by(models.Complaint.created_at.desc()).offset(skip).limit(limit).all()
    return complaints


# --- YENİ EKLENEN: SİLME FONKSİYONU ---
@app.delete("/complaints/{complaint_id}")
def delete_complaint(complaint_id: int, db: Session = Depends(database.get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")

    db.delete(complaint)
    db.commit()
    return {"ok": True}