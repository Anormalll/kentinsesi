from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ComplaintBase(BaseModel):
    title: str
    description: str
    category: str
    location: str
    image_url: Optional[str] = None
    plate: Optional[str] = None
    firm_name: Optional[str] = None
    municipality: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintOut(ComplaintBase):
    id: int
    status: str
    upvotes: int
    created_at: datetime

    class Config:
        orm_mode = True