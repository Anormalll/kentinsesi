from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from .database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    category = Column(String) # Trafik, Insaat vs.
    status = Column(String, default="Beklemede") # Beklemede, Cozuldu
    location = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    
    # Detaylar
    plate = Column(String, nullable=True)
    firm_name = Column(String, nullable=True)
    municipality = Column(String, nullable=True)

    # --- YENİ EKLENEN KOORDİNATLAR ---
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    
    upvotes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Mevcut kodların altına ekle:

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate = Column(String, unique=True, index=True) # Plaka (Örn: 34AB1234)
    serial_no = Column(String) # Ruhsat Seri No
    created_at = Column(DateTime(timezone=True), server_default=func.now())