// src/App.jsx
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/navbar';
import Home from './pages/Home';
import ServiciosList from './pages/Servicios/ServiciosList.jsx';
import ServiciosForm from './pages/Servicios/ServiciosForm.jsx';
import HorariosList from './pages/Horarios/HorariosList.jsx';
import HorariosForm from './pages/Horarios/HorariosForm.jsx';
import HorarioDetalle from './pages/Horarios/HorarioDetalle.jsx';
import CentrosList from './pages/Centros/CentrosList.jsx';
import CentrosForm from './pages/Centros/CentrosForm.jsx';
import CentroDetalle from './pages/Centros/CentroDetalle.jsx';
import NotFound404 from './pages/errors/NotFound404.jsx';
import Forbidden403 from './pages/errors/Forbidden403.jsx';
import ServerError500 from './pages/errors/ServerError500.jsx';
import PoliticaPrivacidad from './pages/Politicas/PoliticaPrivacidad.jsx';
import TerminosCondiciones from './pages/Politicas/TerminosCondiciones.jsx';
import Cookies from './pages/Politicas/Cookies.jsx';
import Footer from './components/footer';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

const App = () => {
  const location = useLocation();

  // Detectar si estamos en una página de error
  const isErrorPage = location.pathname === '/404' ||
                      location.pathname === '/403' ||
                      location.pathname === '/500';

  return (
    <div className="d-flex flex-column min-vh-100">
      {!isErrorPage && <Navbar />}
      <main className="flex-fill">
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Rutas de Servicios */}
          <Route path="/servicios" element={<ServiciosList />} />
          <Route path="/servicios/nuevo" element={<ServiciosForm />} />
          <Route path="/servicios/editar/:id" element={<ServiciosForm />} />

          {/* Rutas de Horarios */}
          <Route path="/horarios" element={<HorariosList />} />
          <Route path="/horarios/nuevo" element={<HorariosForm />} />
          <Route path="/horarios/editar/:id" element={<HorariosForm />} />
          <Route path="/horarios/:id" element={<HorarioDetalle />} />

          {/* Rutas de Centros */}
          <Route path="/centros" element={<CentrosList />} />
          <Route path="/centros/nuevo" element={<CentrosForm />} />
          <Route path="/centros/editar/:id" element={<CentrosForm />} />
          <Route path="/centros/:id" element={<CentroDetalle />} />

          {/* Ruta de Usuarios (próximamente) */}
          <Route path="/usuarios" element={
            <div className="container text-center py-5">
              <h2 className="text-primary">Usuarios - Próximamente</h2>
              <p className="text-muted">Esta sección estará disponible pronto</p>
            </div>
          } />

          {/* Rutas de Políticas */}
          <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
          <Route path="/terminos-condiciones" element={<TerminosCondiciones />} />
          <Route path="/cookies" element={<Cookies />} />

          {/* Rutas de Error */}
          <Route path="/403" element={<Forbidden403 />} />
          <Route path="/404" element={<NotFound404 />} />
          <Route path="/500" element={<ServerError500 />} />

          {/* Ruta 404 - Catch all */}
          <Route path="*" element={<NotFound404 />} />
        </Routes>
      </main>
      {!isErrorPage && <Footer />}
    </div>
  );
};

export default App;
