import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([])
  
  // 1. ESTADO DEL FORMULARIO: Aquí guardamos lo que el usuario escribe
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    node: '',
    priority: 'Media', // Valor por defecto
    status: 'Backlog'
  })

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

  // 2. MANEJAR CAMBIOS: Cuando escribes en un input, actualizamos el estado
  const handleInputChange = (e) => {
    const { name, value } = e.target // Identifica qué campo se tocó (ej: 'title') y qué se escribió.
    setFormData({ ...formData, [name]: value })
  }

  // 3. ENVIAR FORMULARIO: Conectar con el Backend (POST)
  const handleSubmit = async (e) => {
    e.preventDefault() // Evita que la página se recargue sola
    try {
      // Enviamos los datos a la API
      const response = await axios.post('http://127.0.0.1:8000/tasks/', formData)
      
      // Si todo sale bien, agregamos la nueva tarea a la lista visualmente
      setTasks([...tasks, response.data])
      
      // Limpiamos el formulario
      setFormData({ title: '', description: '', node: '', priority: 'Media', status: 'Backlog' })
      alert("¡Tarea creada con éxito!")
    } catch (error) {
      console.error("Error creando tarea:", error)
      alert("Error al crear la tarea")
    }
  }

  const getPriorityColor = (priority) => {
    if (priority === "Crítica") return "#e73ccd"
    if (priority === "Alta") return "#e74c3c"
    if (priority === "Media") return "#f39c12"
    return "#79d341"
  }

  // FUNCIÓN PARA BORRAR
  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de borrar esta tarea?")) return
    try {
      await axios.delete(`http://127.0.0.1:8000/tasks/${id}`)
      // Actualizamos la lista visualmente quitando la tarea borrada
      setTasks(tasks.filter(task => task.id !== id))
    } catch (error) {
      console.error("Error borrando tarea:", error)
    }
  }

  // FUNCIÓN PARA MOVER (ACTUALIZAR ESTADO)
  const handleMove = async (task, direction) => {
    const currentIndex = COLUMNS.indexOf(task.status)
    const newIndex = currentIndex + direction
    
    // Validar que no se salga de los límites (no ir mas allá de Backlog o Terminado)
    if (newIndex < 0 || newIndex >= COLUMNS.length) return

    const newStatus = COLUMNS[newIndex]
    
    // Creamos el objeto actualizado
    const updatedTask = { ...task, status: newStatus }

    try {
      await axios.put(`http://127.0.0.1:8000/tasks/${task.id}`, updatedTask)
      
      // Actualizamos la lista visualmente
      setTasks(tasks.map(t => (t.id === task.id ? updatedTask : t)))
    } catch (error) {
      console.error("Error moviendo tarea:", error)
    }
  }

  return (
    <div className="container">
      <header>
        <h1>ISP-Sync Kanban</h1>
        <p>Gestión de incidencias Wilcom</p>
      </header>

      {/* --- NUEVO: FORMULARIO DE CREACIÓN --- */}
      <section className="form-section">
        <h3>➕ Nueva Tarea</h3>
        <form onSubmit={handleSubmit} className="task-form">
          <input 
            type="text" name="title" placeholder="Título de la tarea" required 
            value={formData.title} onChange={handleInputChange} 
          />
          <input 
            type="text" name="description" placeholder="Descripción breve" 
            value={formData.description} onChange={handleInputChange} 
          />
          <input 
            type="text" name="node" placeholder="Nodo / Ubicación" 
            value={formData.node} onChange={handleInputChange} 
          />
          
          <select name="priority" value={formData.priority} onChange={handleInputChange}>
            <option value="Baja">Prioridad Baja</option>
            <option value="Media">Prioridad Media</option>
            <option value="Alta">Prioridad Alta</option>
            <option value="Crítica">Prioridad Crítica</option>
          </select>

          <button type="submit">Guardar Tarea</button>
        </form>
      </section>

      <div className="kanban-board">
        {COLUMNS.map((colName) => (
          <div key={colName} className="kanban-column">
            <h2>{colName}</h2>
            <div className="column-content">
              {tasks.filter(task => task.status === colName).map(task => (
                <div key={task.id} className="task-card" style={{ borderLeftColor: getPriorityColor(task.priority) }}>
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                  <div className="tags">
                    <span className="tag">📍 {task.node || "N/A"}</span>
                    <span className="tag" style={{ color: getPriorityColor(task.priority), fontWeight: 'bold' }}>
                      {task.priority}
                    </span>
                  </div>
                <div style={{marginTop: '10px', fontSize: '0.9em', color: '#666'}}>
                  👤 {task.responsible_name || "Sin asignar"}
                </div>
                {/* --- NUEVO: BOTONES DE ACCIÓN --- */}
                <div className="card-actions">
                  {/* Botón Mover Izquierda (solo si no es la primera columna) */}
                  {task.status !== "Backlog" && (
                    <button onClick={() => handleMove(task, -1)}>⬅️</button>)}
                  
                  {/* Botón Borrar */}
                  <button onClick={() => handleDelete(task.id)} className="delete-btn">🗑️</button>

                  {/* Botón Mover Derecha (solo si no es la última columna) */}
                  {task.status !== "Terminado" && (
                    <button onClick={() => handleMove(task, 1)}>➡️</button>)}
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