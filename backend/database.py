from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Veritabanı URL'si
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    # Eğer .env yoksa (Render'da .env dosyası olmaz, Environment Variable'dan okur)
    # Buraya hardcoded linkini de koyabilirsin ama doğrusu env'den okumaktır.
    SQLALCHEMY_DATABASE_URL = "postgresql://neondb_owner:npg_lMUGn32rmHRp@ep-royal-sound-ag33cjpy-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# --- TEK VE DOĞRU ENGINE AYARI ---
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Bağlantı kopmasını engeller
    pool_recycle=300,
    pool_size=5,
    max_overflow=10
)
# ---------------------------------

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()