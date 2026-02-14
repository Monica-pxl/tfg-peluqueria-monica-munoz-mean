// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Home = () => {
  return (
    <div className="home">
      <section className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="hero-content text-center text-white">
          <div className="hero-text-box">
            <h1 className="display-3 fw-bold hero-title">
              Bienvenido a <span className="brand-name">HairGest</span>
            </h1>
            <p className="lead mb-5 hero-subtitle">
              Sistema profesional de gestión de servicios de peluquería
            </p>
            <div className="d-flex justify-content-center gap-3 flex-wrap mt-4">
              <Link to="/servicios" className="btn btn-hero btn-hero-primary btn-lg">
                <i className="bi bi-grid-3x3-gap me-2"></i>
                Ver Servicios
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Funcionalidades */}
      <section className="servicios-section py-5">
        <div className="container">
          <div className="section-header mb-5">
            <h2 className="text-center mb-3">Nuestras Funcionalidades</h2>
            <p className="text-center text-muted" style={{ fontSize: '1.1rem' }}>
              Explora las herramientas de gestión disponibles
            </p>
          </div>

          <div className="row g-4">
            <div className="col-12 col-sm-6 col-lg-4">
              <div className="card h-100 shadow-sm servicio-hover position-relative">
                <div className="card-badge">Disponible</div>
                <div className="card-body text-center p-4">
                  <div className="feature-icon-large mb-4">
                    <i className="bi bi-scissors"></i>
                  </div>
                  <h3 className="h4 mb-3 card-title-custom">Servicios Variados</h3>
                  <p className="text-muted card-text-custom">
                    Gestiona todos tus servicios de peluquería de forma profesional y organizada
                  </p>
                  <Link to="/servicios" className="btn btn-card-custom mt-3">
                    Ver más <i className="bi bi-arrow-right ms-2"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-4">
              <div className="card h-100 shadow-sm servicio-hover position-relative">
                <div className="card-badge">Disponible</div>
                <div className="card-body text-center p-4">
                  <div className="feature-icon-large mb-4">
                    <i className="bi bi-calendar-check"></i>
                  </div>
                  <h3 className="h4 mb-3 card-title-custom">Control de Citas</h3>
                  <p className="text-muted card-text-custom">
                    Administra las citas de tus clientes de manera eficiente y sin complicaciones
                  </p>
                  <Link to="/citas" className="btn btn-card-custom mt-3">
                    Ver más <i className="bi bi-arrow-right ms-2"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-4">
              <div className="card h-100 shadow-sm servicio-hover position-relative">
                <div className="card-badge">Disponible</div>
                <div className="card-body text-center p-4">
                  <div className="feature-icon-large mb-4">
                    <i className="bi bi-people"></i>
                  </div>
                  <h3 className="h4 mb-3 card-title-custom">Gestión de Usuarios</h3>
                  <p className="text-muted card-text-custom">
                    Controla y administra los usuarios de tu plataforma de forma segura
                  </p>
                  <Link to="/usuarios" className="btn btn-card-custom mt-3">
                    Ver más <i className="bi bi-arrow-right ms-2"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Ventajas */}
      <section className="ventajas-section py-5">
        <div className="container">
          <div className="section-header mb-5">
            <h2 className="text-center mb-3">¿Por qué elegirnos?</h2>
            <p className="text-center text-muted" style={{ fontSize: '1.1rem' }}>
              Beneficios de usar HairGest
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="ventaja-card text-center">
                <div className="ventaja-icon mb-3">
                  <i className="bi bi-shield-check"></i>
                </div>
                <h4 className="h5 mb-3">Seguro y Confiable</h4>
                <p className="text-muted small">
                  Tus datos están protegidos con la última tecnología
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="ventaja-card text-center">
                <div className="ventaja-icon mb-3">
                  <i className="bi bi-lightning-charge"></i>
                </div>
                <h4 className="h5 mb-3">Rápido y Eficiente</h4>
                <p className="text-muted small">
                  Gestión ágil y optimizada para tu negocio
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="ventaja-card text-center">
                <div className="ventaja-icon mb-3">
                  <i className="bi bi-phone"></i>
                </div>
                <h4 className="h5 mb-3">Multiplataforma</h4>
                <p className="text-muted small">
                  Accede desde cualquier dispositivo, donde quieras
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="ventaja-card text-center">
                <div className="ventaja-icon mb-3">
                  <i className="bi bi-headset"></i>
                </div>
                <h4 className="h5 mb-3">Soporte 24/7</h4>
                <p className="text-muted small">
                  Estamos aquí para ayudarte cuando lo necesites
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
