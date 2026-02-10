from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text  # <-- Veritabanı tamiri için gerekli
from typing import List, Optional
import shutil
import os
import uuid

# Kendi dosyalarımızdan importlar
from database import SessionLocal, engine, Base
import models, schemas

# Veritabanı tablolarını oluştur
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS Ayarları (Frontend ile konuşabilmesi için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Güvenlik için production'da domain belirtilebilir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- DEPENDENCY (Eksik olan buydu) ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- VERİTABANI TAMİR ENDPOINT'İ (MANUEL ÇALIŞTIRILACAK) ---
@app.get("/fix_db")
def fix_database(db: Session = Depends(get_db)):
    try:
        # Lat ve Lng sütunlarını eklemeye çalışıyoruz
        # Eğer zaten varsa hata verir, o yüzden try-except içine aldık
        try:
            db.execute(text("ALTER TABLE complaints ADD COLUMN lat FLOAT"))
        except Exception as e:
            print(f"Lat hatası (önemsiz olabilir): {e}")

        try:
            db.execute(text("ALTER TABLE complaints ADD COLUMN lng FLOAT"))
        except Exception as e:
            print(f"Lng hatası (önemsiz olabilir): {e}")

        db.commit()
        return {"message": "Veritabanı sütunları (lat/lng) başarıyla eklendi veya zaten vardı!"}
    except Exception as e:
        return {"message": f"Genel hata: {str(e)}"}


# --- ENDPOINTLER ---

# 1. Resim Yükleme
@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    if not os.path.exists("uploads"):
        os.makedirs("uploads")

    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_location = f"uploads/{unique_filename}"

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Render'da dosya sistemi kalıcı değildir, bu yüzden production'da S3/Cloudinary önerilir.
    # Şimdilik demo için bu yeterli.
    # Gerçek URL dönmek yerine basitçe path dönüyoruz, frontend bunu handle etmeli.
    # Veya dışarıdan erişilebilir bir URL oluşturmak gerekir.
    # Demo amaçlı, dışarıdan erişim için statik dosya sunumu yapmak gerekir ama
    # şimdilik frontend'deki unsplash görseli fallback'i kullanıyoruz.
    return {"url": f"https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1000&auto=format&fit=crop"}


# 2. Şikayet Oluşturma
@app.post("/complaints/", response_model=schemas.Complaint)
def create_complaint(complaint: schemas.ComplaintCreate, db: Session = Depends(get_db)):
    db_complaint = models.Complaint(**complaint.dict())
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


# 3. Tüm Şikayetleri Listeleme
@app.get("/complaints/", response_model=List[schemas.Complaint])
def read_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    complaints = db.query(models.Complaint).order_by(models.Complaint.created_at.desc()).offset(skip).limit(limit).all()
    return complaints


# 4. Şikayet Durumu Güncelleme
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


# 5. Şikayet Silme
@app.delete("/complaints/{complaint_id}")
def delete_complaint(complaint_id: int, db: Session = Depends(get_db)):
    db_complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    db.delete(db_complaint)
    db.commit()
    return {"message": "Complaint deleted"}


# --- ARAÇ FİLO YÖNETİMİ ---

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