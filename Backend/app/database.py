from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- CONFIGURACIÓN DE LA CONEXIÓN ---
# IMPORTANTE: Reemplaza 'tu_contraseña' por la clave que definiste al instalar PostgreSQL.
# Si tu clave es 'admin123', debe quedar: "postgresql://postgres:admin123@localhost/isp_kanban"
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:Nunito01@localhost/isp_kanban"

# El motor que "maneja" el auto
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# La sesión para hacer consultas
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# La base para crear los modelos (tablas)
Base = declarative_base()