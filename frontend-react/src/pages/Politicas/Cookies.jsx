// src/pages/Politicas/Cookies.jsx
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Cookies = () => {
  return (
    <section className="admin-section-react">
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <h1 className="mb-4 text-center title-main-react">
              <i className="bi bi-cookie me-2 icon-spin"></i>
              Política de Cookies
            </h1>

            <div className="card shadow-sm mb-4 card-react border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary">
                  <i className="bi bi-question-circle-fill me-2"></i>
                  ¿Qué son las Cookies?
                </h5>
                <p className="card-text text-muted">
                  Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestro sitio web.
                  Nos ayudan a mejorar tu experiencia y recordar tus preferencias.
                </p>
              </div>
            </div>

            <div className="card shadow-sm mb-4 card-react border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary">
                  <i className="bi bi-key-fill me-2"></i>
                  Cookies Esenciales
                </h5>
                <p className="card-text text-muted">
                  Utilizamos cookies esenciales para el funcionamiento básico del sitio, como mantener tu sesión activa
                  y recordar tu información de inicio de sesión.
                </p>
              </div>
            </div>

            <div className="card shadow-sm mb-4 card-react border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary">
                  <i className="bi bi-bar-chart-fill me-2"></i>
                  Cookies de Análisis
                </h5>
                <p className="card-text text-muted">
                  Empleamos cookies para analizar cómo los usuarios interactúan con nuestro sitio,
                  lo que nos permite mejorar nuestros servicios y la experiencia del usuario.
                </p>
              </div>
            </div>

            <div className="card shadow-sm mb-4 card-react border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary">
                  <i className="bi bi-sliders me-2"></i>
                  Gestión de Cookies
                </h5>
                <p className="card-text text-muted">
                  Puedes configurar tu navegador para rechazar cookies, pero esto puede afectar algunas funcionalidades del sitio.
                  La mayoría de los navegadores permiten gestionar las preferencias de cookies en su configuración.
                </p>
              </div>
            </div>

            <p className="text-muted mt-4 text-center">
              <small><i className="bi bi-calendar-event me-1"></i>Última actualización: Febrero 2026</small>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cookies;
