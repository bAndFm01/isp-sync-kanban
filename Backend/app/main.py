from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, database
from fastapi.middleware.cors import CORSMiddleware

# Crear las tablas
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ISP-Sync Kanban API")

origins = [
    "http://localhost:5173", # La dirección de tu Frontend React
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permitir GET, POST, PUT, DELETE
    allow_headers=["*"],
)

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

# RUTA 3: ACTUALIZAR TAREA (PUT)
# Permite cambiar estado, asignar responsable, etc.
@app.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db)):
    
    # 1. Buscamos la tarea por su ID
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    
    # 2. Si no existe, lanzamos error 404
    if db_task is None:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    # 3. Actualizamos solo los campos que envió el usuario
    # (exclude_unset=True evita borrar datos que no se enviaron)
    for var, value in task_update.dict(exclude_unset=True).items():
        setattr(db_task, var, value)
    
    # 4. Guardamos cambios
    db.commit()
    db.refresh(db_task)
    return db_task

# RUTA 4: ELIMINAR TAREA (DELETE)
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    # 1. Buscamos la tarea
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    
    # 2. Si no existe, error 404
    if db_task is None:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    # 3. La borramos y confirmamos cambios
    db.delete(db_task)
    db.commit()
    
    return {"mensaje": "Tarea eliminada correctamente"}

# --- ACTUALIZAR TAREA (PUT) ---
@app.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task_update: schemas.TaskCreate, db: Session = Depends(get_db)):
    # 1. Buscamos la tarea
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    # 2. Actualizamos sus datos
    db_task.title = task_update.title
    db_task.description = task_update.description
    db_task.status = task_update.status
    db_task.priority = task_update.priority
    db_task.node = task_update.node
    
    # 3. Guardamos cambios
    db.commit()
    db.refresh(db_task)
    return db_task

# --- BORRAR TAREA (DELETE) ---
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    # 1. Buscamos la tarea
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    # 2. La borramos
    db.delete(db_task)
    db.commit()
    return {"message": "Tarea eliminada exitosamente"}