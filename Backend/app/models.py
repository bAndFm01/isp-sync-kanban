from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    
    # Estados: Backlog, Asignado, En Proceso, Bloqueado, Finalizado
    status = Column(String, default="Backlog")
    
    # Prioridades: Baja, Media, Alta, Crítica
    priority = Column(String, default="Media")
    
    # El requerimiento clave de tu supervisor
    node = Column(String, nullable=True)  # Ej: "Nodo Pirque"
    
    responsible_name = Column(String, nullable=True)
    
    # Fecha de creación automática
    created_at = Column(DateTime(timezone=True), server_default=func.now())