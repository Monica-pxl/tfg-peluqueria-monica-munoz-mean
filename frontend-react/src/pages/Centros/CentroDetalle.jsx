// src/pages/Centros/CentroDetalle.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import centrosService from '../../services/centrosService';
import 'bootstrap/dist/css/bootstrap.min.css';

const CentroDetalle = () => {
  const { id } = useParams();

  const [centro, setCentro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCentro = async () => {
      try {
        setLoading(true);
        const response = await centrosService.getById(id);
        setCentro(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar centro:', err);
        setError('No se pudo cargar el centro');
        setLoading(false);
      }
    };

    if (id) {
      fetchCentro();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando centro...</p>
      </div>
    );
  }

  if (error || !centro) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger-react">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error || 'Centro no encontrado'}
        </div>
        <Link to="/centros" className="btn btn-primary">
          <i className="bi bi-arrow-left me-2"></i>
          Volver a Centros
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
              <Link to="/centros" className="btn btn-link-back-react">
                <i className="bi bi-arrow-left me-2"></i>
                Volver a Centros
              </Link>
              <h2 className="detalle-title-react mt-3">
                <div className="icon-wrapper-react">
                  <i className="bi bi-building-fill"></i>
                </div>
                Detalle del Centro
              </h2>
            </div>

            <div className="card-detalle-react shadow-lg">
              {/* Nombre del centro destacado */}
              <div className="detalle-main-info-react">
                <div className="icon-badge-react">
                  <i className="bi bi-building"></i>
                </div>
                <div className="info-content-react">
                  <span className="info-label-react">Centro</span>
                  <h3 className="info-main-value-react">{centro.nombre}</h3>
                </div>
              </div>

              {/* Grid de información */}
              <div className="detalle-grid-react">
                {/* Dirección */}
                <div className="detalle-item-react">
                  <div className="item-icon-react bg-danger">
                    <i className="bi bi-geo-alt-fill"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">Dirección</span>
                    <p className="item-value-react">
                      {centro.direccion || 'Sin dirección'}
                    </p>
                    {centro.direccion && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(centro.direccion)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-link-detalle-react"
                      >
                        <i className="bi bi-map me-1"></i>
                        Ver en Google Maps
                      </a>
                    )}
                  </div>
                </div>

                {/* Teléfono */}
                <div className="detalle-item-react">
                  <div className="item-icon-react bg-success">
                    <i className="bi bi-telephone-fill"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">Teléfono</span>
                    <p className="item-value-react">
                      {centro.telefono ? (
                        <a href={`tel:${centro.telefono}`} className="link-action-react">
                          {centro.telefono}
                        </a>
                      ) : (
                        <span className="text-muted">Sin teléfono</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="detalle-item-react">
                  <div className="item-icon-react bg-info">
                    <i className="bi bi-envelope-fill"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">Email</span>
                    <p className="item-value-react">
                      {centro.email ? (
                        <a href={`mailto:${centro.email}`} className="link-action-react">
                          {centro.email}
                        </a>
                      ) : (
                        <span className="text-muted">Sin email</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* ID */}
                <div className="detalle-item-react">
                  <div className="item-icon-react bg-secondary">
                    <i className="bi bi-hash"></i>
                  </div>
                  <div className="item-content-react">
                    <span className="item-label-react">ID del Centro</span>
                    <p className="item-value-react">
                      <code className="code-badge-react">{centro._id}</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="detalle-footer-info-react">
                <div className="footer-info-item-react">
                  <i className="bi bi-calendar-plus text-success me-2"></i>
                  <span>Creado: {centro.createdAt ? new Date(centro.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</span>
                </div>
                <div className="footer-info-item-react">
                  <i className="bi bi-calendar-check text-warning me-2"></i>
                  <span>Actualizado: {centro.updatedAt ? new Date(centro.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="detalle-actions-react">
                <Link to="/centros" className="btn btn-secondary-detalle-react">
                  <i className="bi bi-arrow-left me-2"></i>
                  Volver
                </Link>
                <Link
                  to={`/centros/editar/${centro._id}`}
                  className="btn btn-primary-detalle-react"
                >
                  <i className="bi bi-pencil-square me-2"></i>
                  Editar Centro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CentroDetalle;
