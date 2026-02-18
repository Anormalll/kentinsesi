from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import shutil
import os
import uuid

# Ayarları değiştirdiğimiz için artık direkt import edebiliriz:
from database import SessionLocal, engine, Base
import models, schemas

# Veritabanı tablolarını oluştur
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


# --- DEPENDENCY ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- DB FIX ENDPOINT (Veritabanı Sütunlarını Düzeltmek İçin) ---
@app.get("/fix_db")
def fix_database(db: Session = Depends(get_db)):
    try:
        try:
            db.execute(text("ALTER TABLE complaints ADD COLUMN lat FLOAT"))
        except Exception:
            pass  # Zaten varsa hata vermesin
        try:
            db.execute(text("ALTER TABLE complaints ADD COLUMN lng FLOAT"))
        except Exception:
            pass
        db.commit()
        return {"message": "Veritabanı sütunları (lat/lng) başarıyla kontrol edildi/eklendi!"}
    except Exception as e:
        return {"message": f"Hata: {str(e)}"}


# --- ENDPOINTLER ---

@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    # Resimleri 'backend/uploads' klasörüne kaydeder
    if not os.path.exists("uploads"):
        os.makedirs("uploads")

    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_location = f"uploads/{unique_filename}"

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1000&auto=format&fit=crop"}


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


# --- ARAÇ YÖNETİMİ ---

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