import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([])

  // Definimos las columnas que queremos ver
  const COLUMNS = ["Backlog", "En Proceso", "Terminado"]

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/tasks/')
      setTasks(response.data)
    } catch (error) {
      console.error("Error cargando tareas:", error)
    }
  }

  // Esta función nos ayuda a definir colores según la prioridad
  const getPriorityColor = (priority) => {
    if (priority === "Crítica") return "red"
    if (priority === "Alta") return "orange"
    return "gray"
  }

  return (
    <div className="container">
      <header>
        <h1>ISP-Sync Kanban</h1>
        <p>Gestión de incidencias Wilcom</p>
      </header>

      {/* Aquí empieza el Tablero */}
      <div className="kanban-board">
        
        {/* Recorremos las 3 columnas definidas arriba */}
        {COLUMNS.map((colName) => (
          <div key={colName} className="kanban-column">
            <h2>{colName}</h2>
            
            {/* Aquí filtramos: Solo mostramos las tareas que coincidan con esta columna */}
            <div className="column-content">
              {tasks
                .filter(task => task.status === colName)
                .map(task => (
                  <div key={task.id} className="task-card" style={{ borderLeftColor: getPriorityColor(task.priority) }}>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    
                    <div className="tags">
                      <span className="tag">📍 {task.node || "N/A"}</span>
                      <span className="tag" style={{ color: getPriorityColor(task.priority) }}>
                        ⚠ {task.priority}
                      </span>
                    </div>
                    
                    <div style={{marginTop: '10px', fontSize: '0.9em', color: '#666'}}>
                      👤 {task.responsible_name || "Sin asignar"}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}

export default App