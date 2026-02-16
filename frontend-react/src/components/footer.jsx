import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-custom-react py-5">
      <div className="container">
        <div className="row">
          {/* Columna 1: Información de la empresa */}
          <div className="col-md-4 mb-3 mb-md-0">
            <h5 className="footer-heading-react">
              <i className="bi bi-scissors me-2"></i>
              HairGest
            </h5>
            <p className="footer-description-react">
              Sistema de gestión de citas para peluquerías multicentro.
              Reserva tu cita de forma fácil y rápida.
            </p>
            <div className="footer-social-react">
              <a href="https://www.facebook.com/" className="text-white me-3" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="https://www.instagram.com/" className="text-white me-3" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="https://twitter.com/" className="text-white me-3" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="https://www.linkedin.com/" className="text-white" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-linkedin"></i>
              </a>
            </div>
          </div>

          {/* Columna 2: Enlaces rápidos */}
          <div className="col-md-4 mb-3 mb-md-0">
            <h5 className="footer-heading-react">
              <i className="bi bi-link-45deg me-2"></i>
              Enlaces Rápidos
            </h5>
            <ul className="list-unstyled footer-links-react">
              <li>
                <Link to="/servicios" className="text-white">
                  <i className="bi bi-chevron-right me-2"></i>
                  Servicios
                </Link>
              </li>
              <li>
                <Link to="/citas" className="text-white">
                  <i className="bi bi-chevron-right me-2"></i>
                  Citas
                </Link>
              </li>
              <li>
                <Link to="/usuarios" className="text-white">
                  <i className="bi bi-chevron-right me-2"></i>
                  Usuarios
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto */}
          <div className="col-md-4 mb-3 mb-md-0">
            <h5 className="footer-heading-react">
              <i className="bi bi-envelope-at me-2"></i>
              Contacto
            </h5>
            <ul className="list-unstyled footer-contact-react">
              <li>
                <i className="bi bi-geo-alt-fill me-2"></i>
                España
              </li>
              <li>
                <i className="bi bi-telephone-fill me-2"></i>
                +34 XXX XXX XXX
              </li>
              <li>
                <i className="bi bi-envelope-fill me-2"></i>
                info@hairgest.com
              </li>
              <li>
                <i className="bi bi-clock-fill me-2"></i>
                Lun-Sáb: 9:00 - 20:00
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <hr className="footer-divider-react my-4" />

        {/* Copyright y enlaces legales */}
        <div className="row">
          <div className="col-md-6 text-center text-md-start">
            <p className="mb-0 footer-text-react">
              <i className="bi bi-c-circle me-1"></i>
              {currentYear} HairGest - Todos los derechos reservados
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <a href="#" className="text-white me-3 footer-legal-react">Política de Privacidad</a>
            <a href="#" className="text-white me-3 footer-legal-react">Términos y Condiciones</a>
            <a href="#" className="text-white footer-legal-react">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
