import { useState, useEffect } from 'react'
import axios from 'axios'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([])

  // Estado del formulario (incluye responsible_name)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    node: '',
    responsible_name: '',
    priority: 'Media',
    status: 'Backlog'
  })

  // Estado para edición
  const [editingTask, setEditingTask] = useState(null)

  const COLUMNS = ["Backlog", "En Proceso", "Stand-by", "Terminado"]

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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('http://127.0.0.1:8000/tasks/', formData)
      setTasks([...tasks, response.data])
      setFormData({ 
        title: '', description: '', node: '', responsible_name: '', 
        priority: 'Media', status: 'Backlog' 
      })
      alert("¡Tarea creada con éxito!")
    } catch (error) {
      console.error("Error creando tarea:", error)
      alert("Error al crear la tarea")
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de borrar esta tarea?")) return
    try {
      await axios.delete(`http://127.0.0.1:8000/tasks/${id}`)
      setTasks(tasks.filter(task => task.id !== id))
    } catch (error) {
      console.error("Error borrando tarea:", error)
    }
  }

  // --- LÓGICA DRAG AND DROP (NUEVO) ---
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result

    // 1. Si no hay destino o se soltó en el mismo lugar, no hacemos nada
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // 2. Encontrar la tarea que se movió
    const taskMoved = tasks.find(t => t.id.toString() === draggableId)
    const newStatus = destination.droppableId

    // 3. ACTUALIZACIÓN OPTIMISTA (Actualizamos visualmente YA, antes de que responda el servidor)
    const updatedTask = { ...taskMoved, status: newStatus }
    
    // Creamos una nueva lista excluyendo la vieja y agregando la actualizada
    const newTasksList = tasks.map(t => 
      t.id === taskMoved.id ? updatedTask : t
    )
    setTasks(newTasksList)

    // 4. Enviar cambio al Backend
    try {
      await axios.put(`http://127.0.0.1:8000/tasks/${taskMoved.id}`, updatedTask)
    } catch (error) {
      console.error("Error actualizando estado:", error)
      // Si falla, revertimos (opcional, por ahora lo dejamos simple)
      fetchTasks() 
    }
  }

  // --- LÓGICA DE EDICIÓN ---
  const startEditing = (task) => setEditingTask(task)

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditingTask({ ...editingTask, [name]: value })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`http://127.0.0.1:8000/tasks/${editingTask.id}`, editingTask)
      setTasks(tasks.map(t => (t.id === editingTask.id ? editingTask : t)))
      setEditingTask(null)
    } catch (error) {
      console.error("Error actualizando tarea:", error)
      alert("Error al actualizar")
    }
  }

  const getPriorityColor = (priority) => {
    if (priority === "Crítica") return "#e73ccd"
    if (priority === "Alta") return "#e74c3c"
    if (priority === "Media") return "#f39c12"
    return "#79d341"
  }

  return (
    <div className="container">
      <header>
        <h1>ISP-Sync Kanban</h1>
        <p>Gestión de incidencias Wilcom</p>
      </header>

      {/* FORMULARIO CREAR */}
      <section className="form-section">
        <h3>➕ Nueva Tarea</h3>
        <form onSubmit={handleSubmit} className="task-form">
          <input type="text" name="title" placeholder="Título" required value={formData.title} onChange={handleInputChange} />
          <input type="text" name="description" placeholder="Descripción" value={formData.description} onChange={handleInputChange} />
          <input type="text" name="responsible_name" placeholder="Encargado" value={formData.responsible_name} onChange={handleInputChange} />
          <input type="text" name="node" placeholder="Nodo" value={formData.node} onChange={handleInputChange} />
          <select name="priority" value={formData.priority} onChange={handleInputChange}>
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
            <option value="Crítica">Crítica</option>
          </select>
          <button type="submit">Guardar</button>
        </form>
      </section>

      {/* TABLERO DRAG AND DROP */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {COLUMNS.map((colName) => (
            <Droppable key={colName} droppableId={colName}>
              {(provided) => (
                <div 
                  className="kanban-column" 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                >
                  <h2>{colName}</h2>
                  <div className="column-content">
                    {tasks
                      .filter(task => task.status === colName)
                      .map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="task-card"
                              style={{ 
                                ...provided.draggableProps.style, // Estilos necesarios para el movimiento
                                borderLeftColor: getPriorityColor(task.priority) 
                              }}
                            >
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

                              <div className="card-actions">
                                {/* Solo dejamos Editar y Borrar. Las flechas ya no son necesarias */}
                                <button onClick={() => startEditing(task)} title="Editar">✏️</button>
                                <button onClick={() => handleDelete(task.id)} className="delete-btn">🗑️</button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder} {/* Espacio fantasma al arrastrar */}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* MODAL EDITAR */}
      {editingTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>✏️ Editar Tarea</h3>
            <form onSubmit={saveEdit} className="task-form" style={{flexDirection: 'column'}}>
              <label>Título:</label>
              <input name="title" value={editingTask.title} onChange={handleEditChange} required />
              
              <label>Descripción:</label>
              <textarea name="description" value={editingTask.description} onChange={handleEditChange} rows="3" style={{padding: '10px', border: '1px solid #ccc'}} />

              <div style={{display: 'flex', gap: '10px'}}>
                <div style={{flex: 1}}>
                  <label>Encargado:</label>
                  <input name="responsible_name" value={editingTask.responsible_name || ''} onChange={handleEditChange} />
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