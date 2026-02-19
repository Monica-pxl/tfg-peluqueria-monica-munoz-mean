import api from './api';

const citasService = {
  // Obtener todas las citas
  getAll: () => api.get('/citas'),

  // Obtener una cita por ID
  getById: (id) => api.get(`/citas/${id}`),

  // Crear una cita
  create: (cita) => api.post('/citas', cita),

  // Actualizar una cita
  update: (id, cita) => api.put(`/citas/${id}`, cita),

  // Eliminar una cita
  delete: (id) => api.delete(`/citas/${id}`),

  // Marcar cita como realizada
  marcarRealizada: (id, datos) => api.put(`/citas/${id}/marcar-realizada`, datos),

  // Verificar disponibilidad
  verificarDisponibilidad: (profesionalId, fecha, hora) =>
    api.get(`/citas/disponibilidad/${profesionalId}/${fecha}/${hora}`)
};

export default citasService;
