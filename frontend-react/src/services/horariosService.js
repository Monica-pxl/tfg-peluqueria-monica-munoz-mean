import api from './api';

const horariosService = {
  // Obtener todos los horarios
  getAll: () => api.get('/horarios'),

  // Obtener un horario por ID
  getById: (id) => api.get(`/horarios/${id}`),

  // Crear un horario
  create: (horario) => api.post('/horarios', horario),

  // Actualizar un horario
  update: (id, horario) => api.put(`/horarios/${id}`, horario),

  // Eliminar un horario
  delete: (id) => api.delete(`/horarios/${id}`)
};

export default horariosService;
