from fastapi import FastAPI
from . import models
from .database import engine

# --- ¡ESTA ES LA MAGIA! ---
# Esto le dice a la base de datos: "Si no existe la tabla 'tasks', créala ahora mismo"
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ISP-Sync Kanban API",
    version="0.1.0"
)

@app.get("/")
def read_root():
    return {"mensaje": "Backend conectado a PostgreSQL correctamente 🚀"}