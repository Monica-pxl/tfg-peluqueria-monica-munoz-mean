// src/components/Navbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom-futuristic">
      <div className="container-fluid">
        <Link className="navbar-brand brand-animated-futuristic" to="/">
          <i className="bi bi-scissors me-2 brand-icon-rotating"></i>
          <span className="brand-text-gradient">HairGest</span>
        </Link>
        <button
          className="navbar-toggler toggler-animated"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav mb-2 mb-lg-0">
            <li className="nav-item mx-3 nav-item-animated">
              <Link
                className={`nav-link nav-link-futuristic ${isActive('/servicios') ? 'active' : ''}`}
                to="/servicios"
              >
                <i className="bi bi-list-ul me-2"></i>
                <span>Servicios</span>
              </Link>
            </li>
            <li className="nav-item mx-3 nav-item-animated">
              <Link
                className={`nav-link nav-link-futuristic ${isActive('/citas') ? 'active' : ''}`}
                to="/citas"
              >
                <i className="bi bi-calendar-check me-2"></i>
                <span>Citas</span>
              </Link>
            </li>
            <li className="nav-item mx-3 nav-item-animated">
              <Link
                className={`nav-link nav-link-futuristic ${isActive('/usuarios') ? 'active' : ''}`}
                to="/usuarios"
              >
                <i className="bi bi-people me-2"></i>
                <span>Usuarios</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
