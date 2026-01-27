from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Eger Docker kullanmadiysan 'sifre' kismini kendi sifrenle degistir
# Eğer şifreni 12345 yaptıysan satır tam olarak böyle olmalı:
# --- YENİ BULUT ADRESİN (NEON) ---
# Not: Sonuna ?sslmode=require ekledim, Neon bunu şart koşar.
SQLALCHEMY_DATABASE_URL = "postgresql://neondb_owner:npg_lMUGn32rmHRp@ep-royal-sound-ag33cjpy-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()