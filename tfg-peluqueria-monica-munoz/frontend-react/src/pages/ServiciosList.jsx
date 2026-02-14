// src/pages/ServiciosList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllServicios, deleteServicio } from '../services/serviciosService';
import 'bootstrap/dist/css/bootstrap.min.css';

const ServiciosList = () => {
  const [servicios, setServicios] = useState([]);
  const [serviciosFiltrados, setServiciosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Función para cargar los servicios desde la API
  const fetchServicios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllServicios();
      setServicios(data);
      setServiciosFiltrados(data);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error al cargar servicios:', err);
      setError('No se pudieron cargar los servicios. Verifica que el servidor esté activo.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  // Filtrar servicios por búsqueda
  useEffect(() => {
    if (busqueda.trim() === '') {
      setServiciosFiltrados(servicios);
    } else {
      const filtrados = servicios.filter(s =>
        s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (s.descripcion && s.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
      );
      setServiciosFiltrados(filtrados);
    }
  }, [busqueda, servicios]);

  // Función para eliminar un servicio
  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el servicio "${nombre}"?`)) return;

    try {
      await deleteServicio(id);
      setServicios(servicios.filter(s => s._id !== id));
      setSuccessMessage(`✅ Servicio "${nombre}" eliminado correctamente`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('❌ Error al eliminar servicio:', err);
      setError('No se pudo eliminar el servicio. Inténtalo de nuevo.');
      setTimeout(() => setError(null), 4000);
    }
  };

  // Función para ir a editar
  const handleEdit = (id) => {
    navigate(`/servicios/editar/${id}`);
  };

  return (
    <section className="admin-section-react">
      <div className="container mt-5 mb-5">
        <h2 className="mb-4 text-center title-main-react">
          <i className="bi bi-gear-fill me-2 icon-spin"></i>
          Gestión de Servicios
        </h2>

        <div className="mb-4">
          <Link to="/servicios/nuevo" className="btn btn-nuevo-react">
            <i className="bi bi-plus-circle me-2"></i>
            Crear Servicio
          </Link>
        </div>

        {/* Filtros y búsqueda */}
        <div className="filtros-container-react mb-4">
          <div className="filtro-grupo-react busqueda-react">
            <label htmlFor="busqueda">
              <i className="bi bi-search"></i> Buscar:
            </label>
            <input
              type="text"
              id="busqueda"
              className="form-control"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o descripción..."
            />
          </div>

          <div className="resultados-count-react">
            <span className="badge bg-info-react">
              {serviciosFiltrados.length} de {servicios.length} servicios
            </span>
          </div>
        </div>

        {/* Alertas */}
        {successMessage && (
          <div className="alert alert-success-react alert-dismissible fade show" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger-react alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Spinner de carga */}
        {loading && (
          <div className="empty-state-react">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando servicios...</p>
          </div>
        )}

        {/* Empty state - sin servicios */}
        {!loading && serviciosFiltrados.length === 0 && servicios.length === 0 && (
          <div className="empty-state-react">
            <div className="empty-icon-react">✂️</div>
            <h3>No hay servicios registrados</h3>
            <p>Crea tu primer servicio para comenzar</p>
          </div>
        )}

        {/* Empty state - sin resultados */}
        {!loading && serviciosFiltrados.length === 0 && servicios.length > 0 && (
          <div className="empty-state-react">
            <div className="empty-icon-react">🔍</div>
            <h3>No se encontraron servicios</h3>
            <p>No hay servicios que coincidan con la búsqueda</p>
          </div>
        )}

        {/* Tabla de servicios */}
        {!loading && serviciosFiltrados.length > 0 && (
          <div className="table-wrapper-react">
            <table className="table-custom-react">
              <thead>
                <tr>
                  <th><i className="bi bi-tag me-2"></i>Nombre</th>
                  <th><i className="bi bi-file-text me-2"></i>Descripción</th>
                  <th><i className="bi bi-clock me-2"></i>Duración</th>
                  <th><i className="bi bi-cash me-2"></i>Precio</th>
                  <th><i className="bi bi-gear me-2"></i>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {serviciosFiltrados.map(servicio => (
                  <tr key={servicio._id} className="table-row-animated">
                    <td className="fw-bold">{servicio.nombre}</td>
                    <td>{servicio.descripcion || 'Sin descripción'}</td>
                    <td>
                      <span className="badge-hora-react">
                        <i className="bi bi-clock me-1"></i>
                        {servicio.duracion} min
                      </span>
                    </td>
                    <td className="text-success fw-bold">€{servicio.precio}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary-react me-2"
                        onClick={() => handleEdit(servicio._id)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger-react"
                        onClick={() => handleDelete(servicio._id, servicio.nombre)}
                        title="Eliminar"
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default ServiciosList;


