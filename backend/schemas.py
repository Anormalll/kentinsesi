from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# --- MEVCUT ŞİKAYET ŞEMALARI ---
class ComplaintBase(BaseModel):
    title: str
    description: str
    category: str
    location: str
    plate: Optional[str] = None
    image_url: Optional[str] = None
    # --- YENİ EKLENENLER ---
    lat: Optional[float] = None
    lng: Optional[float] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintOut(ComplaintBase):
    id: int
    status: str
    upvotes: int
    created_at: datetime

    class Config:
        from_attributes = True # Pydantic v2 için (v1 ise orm_mode = True)

# --- YENİ EKLENEN: ARAÇ ŞEMALARI ---
class VehicleCreate(BaseModel):
    plate: str
    serial_no: str

class VehicleOut(BaseModel):
    id: int
    plate: str
    serial_no: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Pydantic v2 için (v1 ise orm_mode = True)