// src/services/serviciosService.js
import api from './api';

export const getAllServicios = async () => {
  const response = await api.get('/servicios');
  return response.data;
};

export const getServicioById = async (id) => {
  const response = await api.get(`/servicios/${id}`);
  return response.data;
};

export const createServicio = async (data) => {
  const response = await api.post('/servicios', data);
  return response.data;
};

export const updateServicio = async (id, data) => {
  const response = await api.put(`/servicios/${id}`, data);
  return response.data;
};

export const deleteServicio = async (id) => {
  const response = await api.delete(`/servicios/${id}`);
  return response.data;
};
