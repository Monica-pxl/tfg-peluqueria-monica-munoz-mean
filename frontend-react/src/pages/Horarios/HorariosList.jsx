// src/pages/Horarios/HorariosList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import horariosService from '../../services/horariosService';
import ConfirmModal from '../../components/ConfirmModal';
import 'bootstrap/dist/css/bootstrap.min.css';

const HorariosList = () => {
  const [horarios, setHorarios] = useState([]);
  const [horariosFiltrados, setHorariosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [horarioToDelete, setHorarioToDelete] = useState(null);

  const fetchHorarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await horariosService.getAll();
      setHorarios(response.data);
      setHorariosFiltrados(response.data);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error al cargar horarios:', err);
      setError('No se pudieron cargar los horarios. Verifica que el servidor esté activo.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHorarios();
  }, []);

  useEffect(() => {
    let filtrados = horarios;

    if (busqueda.trim() !== '') {
      filtrados = filtrados.filter(h =>
        (h.profesional?.nombre && h.profesional.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
        (h.profesional?.apellidos && h.profesional.apellidos.toLowerCase().includes(busqueda.toLowerCase())) ||
        (h.dias && h.dias.join(', ').toLowerCase().includes(busqueda.toLowerCase()))
      );
    }

    setHorariosFiltrados(filtrados);
  }, [busqueda, horarios]);

  const handleDelete = (id, profesionalNombre) => {
    setHorarioToDelete({ id, profesionalNombre });
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!horarioToDelete) return;

    try {
      await horariosService.delete(horarioToDelete.id);
      setHorarios(horarios.filter(h => h._id !== horarioToDelete.id));
      setSuccessMessage('✅ Horario eliminado correctamente');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('❌ Error al eliminar horario:', err);
      setError('No se pudo eliminar el horario. Inténtalo de nuevo.');
      setTimeout(() => setError(null), 4000);
    }
  };

  return (
    <section className="admin-section-react">
      <div className="container mt-5 mb-5">
        <h2 className="mb-4 text-center title-main-react">
          <i className="bi bi-clock-fill me-2 icon-spin"></i>
          Gestión de Horarios
        </h2>

        <div className="mb-4">
          <Link to="/horarios/nuevo" className="btn btn-nuevo-react">
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Horario
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
              placeholder="Buscar por profesional o día..."
            />
          </div>

          <div className="resultados-count-react">
            <span className="badge bg-info-react">
              {horariosFiltrados.length} de {horarios.length} horarios
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
            <p className="mt-3">Cargando horarios...</p>
          </div>
        )}

        {!loading && horariosFiltrados.length === 0 && horarios.length === 0 && (
          <div className="empty-state-react">
            <div className="empty-icon-react">🕐</div>
            <h3>No hay horarios registrados</h3>
            <p>Crea un nuevo horario para comenzar</p>
          </div>
        )}

        {!loading && horariosFiltrados.length === 0 && horarios.length > 0 && (
          <div className="empty-state-react">
            <div className="empty-icon-react">🔍</div>
            <h3>No se encontraron horarios</h3>
            <p>No hay horarios que coincidan con la búsqueda</p>
          </div>
        )}

        {!loading && horariosFiltrados.length > 0 && (
          <div className="table-wrapper-react">
            <table className="table-custom-react">
              <thead>
                <tr>
                  <th><i className="bi bi-person-badge me-2"></i>Profesional</th>
                  <th><i className="bi bi-calendar-week me-2"></i>Días</th>
                  <th><i className="bi bi-clock me-2"></i>Hora Inicio</th>
                  <th><i className="bi bi-clock-fill me-2"></i>Hora Fin</th>
                  <th><i className="bi bi-calendar-x me-2"></i>Festivo</th>
                  <th><i className="bi bi-gear me-2"></i>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {horariosFiltrados.map(horario => (
                  <tr key={horario._id} className="table-row-animated">
                    <td>
                      {horario.profesional?.nombre && horario.profesional?.apellidos
                        ? `${horario.profesional.nombre} ${horario.profesional.apellidos}`
                        : 'Sin profesional'}
                    </td>
                    <td>
                      {horario.dias && horario.dias.length > 0
                        ? horario.dias.join(', ')
                        : 'N/A'}
                    </td>
                    <td>{horario.hora_inicio || 'N/A'}</td>
                    <td>{horario.hora_fin || 'N/A'}</td>
                    <td>
                      {horario.fechas_festivas && horario.fechas_festivas.length > 0 ? (
                        <span className="badge bg-warning text-dark" title={`Fechas festivas: ${horario.fechas_festivas.map(f => new Date(f + 'T00:00:00').toLocaleDateString('es-ES')).join(', ')}`}>
                          <i className="bi bi-calendar-event me-1"></i>
                          {horario.fechas_festivas.length} fecha(s)
                        </span>
                      ) : (
                        <span className="badge bg-secondary">Ninguna</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons-react">
                        <Link
                          to={`/horarios/${horario._id}`}
                          className="btn btn-info-react btn-sm me-1"
                          title="Ver detalles"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        <Link
                          to={`/horarios/editar/${horario._id}`}
                          className="btn btn-primary-react btn-sm me-1"
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>
                        <button
                          onClick={() => handleDelete(horario._id, horario.profesional ? `${horario.profesional.nombre} ${horario.profesional.apellidos}` : 'este horario')}
                          className="btn btn-danger-react btn-sm"
                          title="Eliminar"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Horario"
        message={horarioToDelete ? `¿Estás seguro de eliminar el horario de ${horarioToDelete.profesionalNombre}?` : ''}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </section>
  );
};

export default HorariosList;
