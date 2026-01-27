from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Eger Docker kullanmadiysan 'sifre' kismini kendi sifrenle degistir
# Eğer şifreni 12345 yaptıysan satır tam olarak böyle olmalı:
# --- YENİ BULUT ADRESİN (NEON) ---
# Not: Sonuna ?sslmode=require ekledim, Neon bunu şart koşar.
SQLALCHEMY_DATABASE_URL = "postgresql://neondb_owner:npg_lMUGn32rmHRp@ep-royal-sound-ag33cjpy-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# --- BURASI DEĞİŞTİ (Daha Sağlam Bağlantı Ayarları) ---
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # pool_pre_ping=True: En önemlisi bu! Sorgu atmadan önce bağlantıyı test eder.
    pool_pre_ping=True,
    # pool_recycle=300: Bağlantıları 5 dakikada bir yeniler (Neon kesmeden biz yenileriz).
    pool_recycle=300,
    # pool_size=5: Aynı anda açık tutulacak bağlantı sayısı.
    pool_size=5,
    # max_overflow=10: Yoğunlukta açılacak ekstra bağlantı sayısı.
    max_overflow=10
)
# -------------------------------------------------------

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()