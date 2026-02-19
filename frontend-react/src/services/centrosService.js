import api from './api';

const centrosService = {
  // Obtener todos los centros
  getAll: () => api.get('/centros'),

  // Obtener un centro por ID
  getById: (id) => api.get(`/centros/${id}`),

  // Crear un centro
  create: (centro) => api.post('/centros', centro),

  // Actualizar un centro
  update: (id, centro) => api.put(`/centros/${id}`, centro),

  // Eliminar un centro
  delete: (id) => api.delete(`/centros/${id}`)
};

export default centrosService;
