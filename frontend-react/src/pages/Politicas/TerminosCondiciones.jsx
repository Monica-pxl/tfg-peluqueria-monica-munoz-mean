// src/pages/Politicas/TerminosCondiciones.jsx
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const TerminosCondiciones = () => {
  return (
    <section className="admin-section-react">
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <h1 className="mb-4 text-center title-main-react">
              <i className="bi bi-file-earmark-text-fill me-2 icon-spin"></i>
              Términos y Condiciones
            </h1>

            <div className="card shadow-sm mb-4 card-react border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  1. Aceptación de los Términos
                </h5>
                <p className="card-text text-muted">
                  Al acceder y utilizar HairGest, aceptas estar sujeto a estos términos y condiciones.
                  Si no estás de acuerdo, por favor no utilices nuestros servicios.
                </p>
              </div>
            </div>

            <div className="card shadow-sm mb-4 card-react border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary">
                  <i className="bi bi-person-check-fill me-2"></i>
                  2. Uso del Servicio
                </h5>
                <p className="card-text text-muted">
                  Nuestro servicio está destinado para la reserva de citas en peluquerías.
                  Te comprometes a proporcionar información veraz y a utilizar el servicio de manera responsable.
                </p>
              </div>
            </div>

            <div className="card shadow-sm mb-4 card-react border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary">
                  <i className="bi bi-calendar-x-fill me-2"></i>
                  3. Cancelaciones
                </h5>
                <p className="card-text text-muted">
                  Las cancelaciones deben realizarse con al menos 24 horas de antelación.
                  Las cancelaciones tardías pueden estar sujetas a políticas específicas de cada centro.
                </p>
              </div>
            </div>

            <div className="card shadow-sm mb-4 card-react border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary">
                  <i className="bi bi-shield-fill-exclamation me-2"></i>
                  4. Responsabilidad
                </h5>
                <p className="card-text text-muted">
                  HairGest actúa como intermediario entre clientes y peluquerías.
                  No nos hacemos responsables de la calidad de los servicios prestados por los centros asociados.
                </p>
              </div>
            </div>

            <div className="card shadow-sm mb-4 card-react border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary">
                  <i className="bi bi-pencil-square me-2"></i>
                  5. Modificaciones
                </h5>
                <p className="card-text text-muted">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento.
                  Los cambios entrarán en vigor inmediatamente tras su publicación.
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

export default TerminosCondiciones;
