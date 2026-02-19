import api from './api';

const serviciosService = {
  // Obtener todos los servicios
  getAll: () => api.get('/servicios'),

  // Crear un servicio
  create: (servicio) => api.post('/servicios', servicio),

  // Actualizar un servicio
  update: (id, servicio) => api.put(`/servicios/${id}`, servicio),

  // Eliminar un servicio
  delete: (id) => api.delete(`/servicios/${id}`)
};

export default serviciosService;
