// src/pages/Horarios/HorarioDetalle.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import horariosService from '../../services/horariosService';
import 'bootstrap/dist/css/bootstrap.min.css';

const HorarioDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [horario, setHorario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHorario = async () => {
      try {
        setLoading(true);
        const response = await horariosService.getById(id);
        setHorario(response.data);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error al cargar el horario:', err);
        setError('No se pudo cargar el horario');
        setLoading(false);
      }
    };

    fetchHorario();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este horario?')) return;

    try {
      await horariosService.delete(id);
      navigate('/horarios');
    } catch (err) {
      console.error('❌ Error al eliminar:', err);
      setError('No se pudo eliminar el horario');
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando horario...</p>
      </div>
    );
  }

  if (error || !horario) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger-react">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error || 'Horario no encontrado'}
        </div>
        <Link to="/horarios" className="btn btn-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Volver a Horarios
        </Link>
      </div>
    );
  }

  return (
    <section className="admin-section-react detalle-view-react">
      <div className="container mt-5 mb-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            {/* Header con título */}
            <div className="detalle-header-react mb-4">
              <Link to="/horarios" className="btn btn-link-back-react">
                <i className="bi bi-arrow-left me-2"></i>
                Volver a Horarios
              </Link>
              <h2 className="detalle-title-react mt-3">
                <div className="icon-wrapper-react">
                  <i className="bi bi-clock-fill"></i>
                </div>
                Detalle del Horario
              </h2>
            </div>

            <div className="card-detalle-react shadow-lg">
              {/* Nombre del profesional destacado */}
              <div className="detalle-main-info-react">
                <div className="icon-badge-react">
                  <i className="bi bi-person-badge"></i>
                </div>
                <div className="info-content-react">
                  <span className="info-label-react">Profesional</span>
                  <h3 className="info-main-value-react">
                    {horario.profesional?.nombre && horario.profesional?.apellidos
                      ? `${horario.profesional.nombre} ${horario.profesional.apellidos}`
                      : 'Sin profesional'}
                  </h3>
                </div>
              </div>

              {/* Grid de información */}
              <div className="detalle-grid-react">
                {/* Días de trabajo */}
                <div className="detalle-item-react" style={{ gridColumn: '1 / -1' }}>
                  <div className="item-icon-react bg-primary">
                    <i className="bi bi-calendar-week"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">Días de trabajo</span>
                    <p className="item-value-react">
                      {horario.dias && horario.dias.length > 0 ? (
                        horario.dias.map((dia, index) => (
                          <span key={index} className="badge bg-info text-dark me-2 mb-2">
                            {dia}
                          </span>
                        ))
                      ) : (
                        'No especificado'
                      )}
                    </p>
                  </div>
                </div>

                {/* Hora de inicio */}
                <div className="detalle-item-react">
                  <div className="item-icon-react bg-success">
                    <i className="bi bi-clock"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">Hora de inicio</span>
                    <p className="item-value-react">
                      <span className="badge-hora-react">
                        <i className="bi bi-clock me-1"></i>
                        {horario.hora_inicio || 'No especificado'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Hora de fin */}
                <div className="detalle-item-react">
                  <div className="item-icon-react bg-danger">
                    <i className="bi bi-clock-fill"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">Hora de fin</span>
                    <p className="item-value-react">
                      <span className="badge-hora-react">
                        <i className="bi bi-clock-fill me-1"></i>
                        {horario.hora_fin || 'No especificado'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Fechas festivas - Solo mostrar si hay */}
                {horario.fechas_festivas && horario.fechas_festivas.length > 0 ? (
                  <div className="detalle-item-react" style={{ gridColumn: '1 / -1' }}>
                    <div className="item-icon-react bg-warning">
                      <i className="bi bi-calendar2-x"></i>
                    </div>
                    <div className="item-content-react">
                      <span className="item-label-react">Fechas festivas específicas ({horario.fechas_festivas.length})</span>
                      <div className="mt-2">
                        {horario.fechas_festivas.map((fecha, index) => (
                          <span key={index} className="badge bg-warning text-dark me-2 mb-2">
                            <i className="bi bi-calendar-x me-1"></i>
                            {new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="detalle-item-react">
                    <div className="item-icon-react bg-secondary">
                      <i className="bi bi-calendar-check"></i>
                    </div>
                    <div className="item-content-react">
                      <span className="item-label-react">Fechas festivas</span>
                      <p className="item-value-react">
                        <span className="badge bg-secondary">Sin fechas festivas</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="detalle-footer-react">
                <Link to="/horarios" className="btn btn-secondary me-2">
                  <i className="bi bi-arrow-left me-2"></i>
                  Volver
                </Link>
                <Link to={`/horarios/editar/${id}`} className="btn btn-primary-react me-2">
                  <i className="bi bi-pencil me-2"></i>
                  Editar
                </Link>
                <button onClick={handleDelete} className="btn btn-danger-react">
                  <i className="bi bi-trash me-2"></i>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HorarioDetalle;
