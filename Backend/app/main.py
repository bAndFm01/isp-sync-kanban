from fastapi import FastAPI

# Creamos la aplicación
app = FastAPI(
    title="ISP-Sync Kanban API",
    description="API para la gestión de tareas de Wilcom (Planta, Atención, DC)",
    version="0.1.0"
)

# Ruta de prueba (para ver si funciona)
@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido al Backend de ISP-Sync", "estado": "funcionando"}