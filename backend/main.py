import shutil
import os
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, database

# Veritabanı tablolarını oluştur
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# --- 1. GARANTİLİ KLASÖR YOLU AYARI ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

print(f"--- LOG: Resimler şu klasöre kaydedilecek: {UPLOAD_DIR} ---")

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- CORS AYARLARI ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ENDPOINTLER ---

@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    safe_filename = file.filename.replace(" ", "_")
    file_location = os.path.join(UPLOAD_DIR, safe_filename)
    print(f"--- LOG: Dosya yazılıyor: {file_location} ---")

    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
    except Exception as e:
        print(f"--- HATA: Dosya yazılamadı! {e}")
        raise HTTPException(status_code=500, detail="Dosya sunucuya kaydedilemedi")

    base_url = "https://kentinsesi.onrender.com"
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


@app.delete("/complaints/{complaint_id}")
def delete_complaint(complaint_id: int, db: Session = Depends(database.get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")

    db.delete(complaint)
    db.commit()
    return {"ok": True}


# --- ARAÇ ENDPOINTLERİ (DÜZELTİLDİ) ---
# DİKKAT: VehicleOut yerine schemas.VehicleOut yazdık

@app.post("/vehicles/", response_model=schemas.VehicleOut)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(database.get_db)):
    # Aynı plaka var mı kontrol et
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.plate == vehicle.plate).first()
    if db_vehicle:
        raise HTTPException(status_code=400, detail="Bu plaka zaten kayıtlı")

    new_vehicle = models.Vehicle(plate=vehicle.plate, serial_no=vehicle.serial_no)
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle


@app.get("/vehicles/", response_model=List[schemas.VehicleOut])
def read_vehicles(db: Session = Depends(database.get_db)):
    return db.query(models.Vehicle).all()


@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(database.get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Araç bulunamadı")
    db.delete(vehicle)
    db.commit()
    return {"ok": True}