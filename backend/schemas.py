from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ComplaintBase(BaseModel):
    title: str
    description: str
    category: str
    location: str
    plate: Optional[str] = None
    image_url: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintStatusUpdate(BaseModel):
    status: str

class Complaint(ComplaintBase):
    id: int
    status: str
    upvotes: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- ARAÇ ŞEMALARI ---

class VehicleBase(BaseModel):
    plate: str
    serial_no: str

class VehicleCreate(VehicleBase):
    pass

class Vehicle(VehicleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True