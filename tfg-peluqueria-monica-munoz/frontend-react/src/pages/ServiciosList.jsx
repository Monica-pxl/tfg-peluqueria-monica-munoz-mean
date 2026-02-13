// src/pages/ServiciosList.jsx
import React, { useState, useEffect } from 'react';
import { getAllServicios, deleteServicio } from '../services/serviciosService';
import 'bootstrap/dist/css/bootstrap.min.css';

const ServiciosList = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar los servicios desde la API
  const fetchServicios = async () => {
    try {
      setLoading(true);
      const data = await getAllServicios();
      setServicios(data);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error al cargar servicios:', err);
      setError('No se pudieron cargar los servicios.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  // Función para eliminar un servicio
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
      await deleteServicio(id);
      setServicios(servicios.filter(s => s._id !== id)); // Actualizamos el estado
    } catch (err) {
      console.error('❌ Error al eliminar servicio:', err);
      alert('No se pudo eliminar el servicio.');
    }
  };

  return (
    <div className="container mt-4">
      <h2 style={{ color: 'blue', marginBottom: '20px' }}>Listado de Servicios</h2>

      {loading && <p className="alert alert-info">Cargando servicios...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <>
          <div className="mb-3">
            <button
              className="btn btn-primary"
              onClick={() => window.location.href = '/servicios/nuevo'}
            >
              + Nuevo Servicio
            </button>
          </div>
          <table className="table table-striped mt-3">
          <thead className="table-dark">
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Duración</th>
            <th>Acciones</th>
          </tr>
          </thead>
          <tbody>
          {servicios.map(servicio => (
            <tr key={servicio._id}>
              <td>{servicio.nombre}</td>
              <td>{servicio.descripcion}</td>
              <td>{servicio.precio} €</td>
              <td>{servicio.duracion} min</td>
              <td>
                {/* Aquí luego podrías poner botones de editar */}
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(servicio._id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {servicios.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center">No hay servicios disponibles</td>
            </tr>
          )}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
};

export default ServiciosList;
