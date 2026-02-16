// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ServiciosList from './pages/ServiciosList';
import ServiciosForm from './pages/ServiciosForm';
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
          <Route path="/servicios" element={<ServiciosList />} />
          <Route path="/servicios/nuevo" element={<ServiciosForm />} />
          <Route path="/servicios/editar/:id" element={<ServiciosForm />} />
          <Route path="/citas" element={
            <div className="container text-center py-5">
              <h2 className="text-primary">Citas - Próximamente</h2>
              <p className="text-muted">Esta sección estará disponible pronto</p>
            </div>
          } />
          <Route path="/usuarios" element={
            <div className="container text-center py-5">
              <h2 className="text-primary">Usuarios - Próximamente</h2>
              <p className="text-muted">Esta sección estará disponible pronto</p>
            </div>
          } />
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


