from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
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
    
    upvotes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())