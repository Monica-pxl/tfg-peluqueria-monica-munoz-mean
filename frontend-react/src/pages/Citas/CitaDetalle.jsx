// src/pages/Citas/CitaDetalle.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import citasService from '../../services/citasService';
import 'bootstrap/dist/css/bootstrap.min.css';

const CitaDetalle = () => {
  const { id } = useParams();

  const [cita, setCita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchCita = async () => {
      try {
        setLoading(true);
        const response = await citasService.getById(id);
        setCita(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar cita:', err);
        setError('No se pudo cargar la cita');
        setLoading(false);
      }
    };

    if (id) {
      fetchCita();
    }
  }, [id]);

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
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

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando cita...</p>
      </div>
    );
  }

  if (error || !cita) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger-react">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error || 'Cita no encontrada'}
        </div>
        <Link to="/citas" className="btn btn-primary">
          <i className="bi bi-arrow-left me-2"></i>
          Volver a Citas
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
              <Link to="/citas" className="btn btn-link-back-react">
                <i className="bi bi-arrow-left me-2"></i>
                Volver a Citas
              </Link>
              <h2 className="detalle-title-react mt-3">
                <div className="icon-wrapper-react">
                  <i className="bi bi-calendar-event-fill"></i>
                </div>
                Detalle de la Cita
              </h2>
            </div>

            {successMessage && (
              <div className="alert alert-success-react mb-4 alert-animated">
                <i className="bi bi-check-circle-fill me-2"></i>
                {successMessage}
              </div>
            )}

            <div className="card-detalle-react shadow-lg">
              {/* Estado actual destacado */}
              <div className="detalle-main-info-react">
                <div className="icon-badge-react">
                  <i className="bi bi-info-circle-fill"></i>
                </div>
                <div className="info-content-react">
                  <span className="info-label-react">Estado de la Cita</span>
                  <h3 className="info-main-value-react">
                    <span className={`badge-status-large ${getBadgeClass(cita.estado)}`}>
                      {cita.estado.toUpperCase()}
                    </span>
                  </h3>
                </div>
              </div>

              {/* Grid de información */}
              <div className="detalle-grid-react">
                {/* Cliente */}
                <div className="detalle-item-react">
                  <div className="item-icon-react bg-primary">
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">Cliente</span>
                    <p className="item-value-react">
                      {cita.usuario?.nombre || cita.usuarioNombre || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Profesional */}
                <div className="detalle-item-react">
                  <div className="item-icon-react bg-success">
                    <i className="bi bi-person-badge-fill"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">Profesional</span>
                    <p className="item-value-react">
                      {cita.profesional
                        ? `${cita.profesional.nombre} ${cita.profesional.apellidos || ''}`
                        : `${cita.profesionalNombre || ''} ${cita.profesionalApellidos || ''}`
                      }
                    </p>
                  </div>
                </div>

                {/* Servicio */}
                <div className="detalle-item-react">
                  <div className="item-icon-react bg-danger">
                    <i className="bi bi-scissors"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">Servicio</span>
                    <p className="item-value-react">
                      {cita.servicio?.nombre || cita.servicioNombre || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Centro */}
                <div className="detalle-item-react">
                  <div className="item-icon-react bg-info">
                    <i className="bi bi-building-fill"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">Centro</span>
                    <p className="item-value-react">
                      {cita.centro?.nombre || cita.centroNombre || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Fecha */}
                <div className="detalle-item-react">
                  <div className="item-icon-react bg-warning">
                    <i className="bi bi-calendar-event"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">Fecha</span>
                    <p className="item-value-react">
                      {formatearFecha(cita.fecha)}
                    </p>
                  </div>
                </div>

                {/* Hora */}
                <div className="detalle-item-react">
                  <div className="item-icon-react bg-dark">
                    <i className="bi bi-clock-fill"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">Hora</span>
                    <p className="item-value-react">{cita.hora}</p>
                  </div>
                </div>

                {/* Precio */}
                <div className="detalle-item-react highlight-item">
                  <div className="item-icon-react bg-success">
                    <i className="bi bi-cash-coin"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">Precio</span>
                    <p className="item-value-react precio-destacado">
                      €{cita.precio}
                    </p>
                  </div>
                </div>
              </div>


              {/* Botones de acción */}
              <div className="detalle-actions-react">
                <Link to="/citas" className="btn btn-secondary-detalle-react">
                  <i className="bi bi-arrow-left me-2"></i>
                  Volver
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CitaDetalle;
