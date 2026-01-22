from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# 1. Esquema Base (Lo que tienen en común)
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    node: Optional[str] = None     # El campo clave para tu supervisor
    priority: str = "Media"        # Baja, Media, Alta, Crítica
    status: str = "Backlog"        # Backlog, Asignado, etc.
    responsible_name: Optional[str] = None

# 2. Esquema para CREAR (Lo que esperamos recibir del usuario)
# Hereda todo de TaskBase
class TaskCreate(TaskBase):
    pass

# 3. Esquema para RESPONDER (Lo que devolvemos al usuario)
class Task(TaskBase):
    id: int
    created_at: datetime

    class Config:
        # Esto permite que Pydantic lea datos de SQLAlchemy
        from_attributes = True