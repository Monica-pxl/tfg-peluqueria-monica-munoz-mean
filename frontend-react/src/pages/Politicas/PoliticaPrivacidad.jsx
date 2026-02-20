// src/pages/Politicas/PoliticaPrivacidad.jsx
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const PoliticaPrivacidad = () => {
  return (
    <section className="admin-section-react">
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <h1 className="mb-4 text-center title-main-react">
              <i className="bi bi-shield-lock-fill me-2 icon-spin"></i>
              Política de Privacidad
            </h1>

            <div className="card shadow-sm mb-4 card-react border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  1. Información que Recopilamos
                </h5>
                <p className="card-text text-muted">
                  En HairGest recopilamos información personal cuando te registras en nuestra plataforma,
                  incluyendo nombre, correo electrónico y datos de contacto necesarios para la gestión de citas.
                </p>
              </div>
            </div>

            <div className="card shadow-sm mb-4 card-react border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary">
                  <i className="bi bi-gear-fill me-2"></i>
                  2. Uso de la Información
                </h5>
                <p className="card-text text-muted">
                  Utilizamos tu información para gestionar tus citas, enviarte confirmaciones y recordatorios,
                  y mejorar nuestros servicios. No compartimos tus datos con terceros sin tu consentimiento.
                </p>
              </div>
            </div>

            <div className="card shadow-sm mb-4 card-react border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary">
                  <i className="bi bi-shield-check me-2"></i>
                  3. Seguridad de los Datos
                </h5>
                <p className="card-text text-muted">
                  Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales
                  contra accesos no autorizados, pérdida o destrucción.
                </p>
              </div>
            </div>

            <div className="card shadow-sm mb-4 card-react border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary">
                  <i className="bi bi-person-check-fill me-2"></i>
                  4. Tus Derechos
                </h5>
                <p className="card-text text-muted">
                  Tienes derecho a acceder, rectificar, cancelar u oponerte al tratamiento de tus datos personales.
                  Puedes contactarnos en cualquier momento para ejercer estos derechos.
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

export default PoliticaPrivacidad;
