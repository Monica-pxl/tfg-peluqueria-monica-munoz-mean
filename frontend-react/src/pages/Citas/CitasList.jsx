// src/pages/Citas/CitasList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import citasService from '../../services/citasService';
import 'bootstrap/dist/css/bootstrap.min.css';

const CitasList = () => {
  const [citas, setCitas] = useState([]);
  const [citasFiltradas, setCitasFiltradas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchCitas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await citasService.getAll();
      setCitas(response.data);
      setCitasFiltradas(response.data);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error al cargar citas:', err);
      setError('No se pudieron cargar las citas. Verifica que el servidor esté activo.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitas();
  }, []);

  useEffect(() => {
    let filtradas = citas;

    if (busqueda.trim() !== '') {
      filtradas = filtradas.filter(c =>
        (c.usuario?.nombre && c.usuario.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
        (c.profesional?.nombre && c.profesional.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
        (c.servicio?.nombre && c.servicio.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      );
    }

    if (filtroEstado !== 'todos') {
      filtradas = filtradas.filter(c => c.estado === filtroEstado);
    }

    setCitasFiltradas(filtradas);
  }, [busqueda, filtroEstado, citas]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cita?')) return;

    try {
      await citasService.delete(id);
      setCitas(citas.filter(c => c._id !== id));
      setSuccessMessage('✅ Cita eliminada correctamente');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('❌ Error al eliminar cita:', err);
      setError('No se pudo eliminar la cita. Inténtalo de nuevo.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const opciones = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
  };

  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'pendiente': return 'bg-warning text-dark';
      case 'confirmada': return 'bg-info text-white';
      case 'realizada': return 'bg-success';
      case 'cancelada': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <section className="admin-section-react">
      <div className="container mt-5 mb-5">
        <h2 className="mb-4 text-center title-main-react">
          <i className="bi bi-calendar-check-fill me-2 icon-spin"></i>
          Gestión de Citas
        </h2>

        <div className="mb-4">
          <Link to="/citas/nueva" className="btn btn-nuevo-react">
            <i className="bi bi-plus-circle me-2"></i>
            Nueva Cita
          </Link>
        </div>

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
              placeholder="Usuario, profesional o servicio..."
            />
          </div>

          <div className="filtro-grupo-react">
            <label htmlFor="filtroEstado">
              <i className="bi bi-funnel"></i> Estado:
            </label>
            <select
              id="filtroEstado"
              className="form-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div className="resultados-count-react">
            <span className="badge bg-info-react">
              {citasFiltradas.length} de {citas.length} citas
            </span>
          </div>
        </div>

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

        {loading && (
          <div className="empty-state-react">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando citas...</p>
          </div>
        )}

        {!loading && citasFiltradas.length === 0 && citas.length === 0 && (
          <div className="empty-state-react">
            <div className="empty-icon-react">📅</div>
            <h3>No hay citas registradas</h3>
            <p>Crea una nueva cita para comenzar</p>
          </div>
        )}

        {!loading && citasFiltradas.length === 0 && citas.length > 0 && (
          <div className="empty-state-react">
            <div className="empty-icon-react">🔍</div>
            <h3>No se encontraron citas</h3>
            <p>No hay citas que coincidan con los filtros</p>
          </div>
        )}

        {!loading && citasFiltradas.length > 0 && (
          <div className="table-wrapper-react">
            <table className="table-custom-react">
              <thead>
                <tr>
                  <th><i className="bi bi-person me-2"></i>Cliente</th>
                  <th><i className="bi bi-person-badge me-2"></i>Profesional</th>
                  <th><i className="bi bi-scissors me-2"></i>Servicio</th>
                  <th><i className="bi bi-calendar me-2"></i>Fecha</th>
                  <th><i className="bi bi-clock me-2"></i>Hora</th>
                  <th><i className="bi bi-cash me-2"></i>Precio</th>
                  <th><i className="bi bi-info-circle me-2"></i>Estado</th>
                  <th><i className="bi bi-gear me-2"></i>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citasFiltradas.map(cita => (
                  <tr key={cita._id} className="table-row-animated">
                    <td>{cita.usuario?.nombre || cita.usuarioNombre || 'N/A'}</td>
                    <td>
                      {cita.profesional
                        ? `${cita.profesional.nombre} ${cita.profesional.apellidos || ''}`
                        : `${cita.profesionalNombre || ''} ${cita.profesionalApellidos || ''}`
                      }
                    </td>
                    <td>{cita.servicio?.nombre || cita.servicioNombre || 'N/A'}</td>
                    <td>{formatearFecha(cita.fecha)}</td>
                    <td>
                      <span className="badge-hora-react">
                        <i className="bi bi-clock me-1"></i>
                        {cita.hora}
                      </span>
                    </td>
                    <td className="text-success fw-bold">€{cita.precio}</td>
                    <td>
                      <span className={`badge ${getBadgeClass(cita.estado)}`}>
                        {cita.estado}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/citas/${cita._id}`}
                        className="btn btn-sm btn-info-react me-2"
                        title="Ver detalle"
                      >
                        <i className="bi bi-eye"></i>
                      </Link>
                      <button
                        className="btn btn-sm btn-danger-react"
                        onClick={() => handleDelete(cita._id)}
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

export default CitasList;
