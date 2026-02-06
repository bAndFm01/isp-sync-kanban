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
    responsible_name: '',
    priority: 'Media', // Valor por defecto
    status: 'Backlog'
  })

  // Estado para controlar la edición (Si es null, el modal está cerrado)
  const [editingTask, setEditingTask] = useState(null)

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

  // A. ABRIR EL MODAL: Carga los datos de la tarjeta en la memoria temporal
  const startEditing = (task) => {
    setEditingTask(task)
  }

  // B. ESCRIBIR EN EL MODAL: Igual que el formulario de crear, pero para editar
  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditingTask({ ...editingTask, [name]: value })
  }

  // C. GUARDAR CAMBIOS (PUT):
  const saveEdit = async (e) => {
    e.preventDefault()
    try {
      // Enviamos los cambios al Backend
      await axios.put(`http://127.0.0.1:8000/tasks/${editingTask.id}`, editingTask)
      
      // Actualizamos la lista visualmente (reemplazamos la vieja por la nueva)
      setTasks(tasks.map(t => (t.id === editingTask.id ? editingTask : t)))
      
      // Cerramos el modal
      setEditingTask(null)
    } catch (error) {
      console.error("Error actualizando tarea:", error)
      alert("Error al actualizar")
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
            type="text" 
            name="responsible_name" 
            placeholder="Encargado" 
            value={formData.responsible_name} 
            onChange={handleInputChange} 
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
                  <button onClick={() => startEditing(task)} title="Editar">✏️</button>
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
      {editingTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>✏️ Editar Tarea</h3>
            <form onSubmit={saveEdit} className="task-form" style={{flexDirection: 'column'}}>
              
              <label>Título:</label>
              <input 
                name="title" value={editingTask.title} onChange={handleEditChange} required 
              />
              
              <label>Descripción:</label>
              <textarea 
                name="description" value={editingTask.description} onChange={handleEditChange} rows="3"
                style={{padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontFamily: 'sans-serif'}}
              />

              <div style={{display: 'flex', gap: '10px'}}>
                <div style={{flex: 1}}>
                  <label>Encargado:</label>
                  <input 
                    name="responsible_name" 
                    value={editingTask.responsible_name || ''} 
                    onChange={handleEditChange} 
                    placeholder="Nombre del técnico"
                  />
                </div>
                <div style={{flex: 1}}>
                   <label>Nodo:</label>
                   <input name="node" value={editingTask.node || ''} onChange={handleEditChange} />
                </div>
              </div>

              <div style={{display: 'flex', gap: '10px'}}>
                <div style={{flex: 1}}>
                   <label>Prioridad:</label>
                   <select name="priority" value={editingTask.priority} onChange={handleEditChange}>
                     <option value="Baja">Baja</option>
                     <option value="Media">Media</option>
                     <option value="Alta">Alta</option>
                     <option value="Crítica">Crítica</option>
                   </select>
                </div>
                <div style={{flex: 1}}>
                   <label>Estado:</label>
                   <select name="status" value={editingTask.status} onChange={handleEditChange}>
                     {COLUMNS.map(col => <option key={col} value={col}>{col}</option>)}
                   </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setEditingTask(null)} className="btn-cancel">Cancelar</button>
                <button type="submit" className="btn-save">Guardar Cambios</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App