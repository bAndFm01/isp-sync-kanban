from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, database

# Crear las tablas (esto ya lo tenías)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ISP-Sync Kanban API")

# Dependencia: Obtener la sesión de la base de datos
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- RUTAS (ENDPOINTS) ---

@app.get("/")
def read_root():
    return {"mensaje": "Backend ISP-Sync Operativo 🚀"}

# RUTA 1: CREAR TAREA (POST)
# Recibe un 'task' con formato TaskCreate
# Usa la sesión 'db'
@app.post("/tasks/", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    
    # 1. Convertimos el esquema a modelo de base de datos
    db_task = models.Task(**task.dict())
    
    # 2. Agregamos a la sesión (preparamos para guardar)
    db.add(db_task)
    
    # 3. Guardamos los cambios (Confirmar transacción)
    db.commit()
    
    # 4. Refrescamos para obtener el ID generado y la fecha
    db.refresh(db_task)
    
    return db_task

# RUTA 2: LEER TAREAS (GET)
# response_model=list[schemas.Task] le dice a Swagger que devolveremos una LISTA de tareas
@app.get("/tasks/", response_model=list[schemas.Task])
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Buscamos en la tabla Task
    # offset(skip): saltarse los primeros X (paginación)
    # limit(limit): traer máximo 100 (para no colapsar si hay miles)
    tasks = db.query(models.Task).offset(skip).limit(limit).all()
    return tasks