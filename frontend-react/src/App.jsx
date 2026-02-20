// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
import Footer from './components/footer';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

const App = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
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

          {/* Ruta 404 */}
          <Route path="*" element={
            <div className="container text-center py-5">
              <h2 className="text-danger">404 - Página no encontrada</h2>
              <a href="/" className="btn btn-primary mt-3">Volver al inicio</a>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
