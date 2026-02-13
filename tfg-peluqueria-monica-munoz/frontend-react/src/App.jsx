// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ServiciosList from './pages/ServiciosList';
import ServiciosForm from './pages/ServiciosForm';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  return (
    <div className="container mt-4">
      <h1 style={{ color: 'red', marginBottom: '20px' }}>App de Servicios - React funcionando!</h1>
      <Routes>
        <Route path="/" element={<Navigate to="/servicios" />} />
        <Route path="/servicios" element={<ServiciosList />} />
        <Route path="/servicios/nuevo" element={<ServiciosForm />} />
        <Route path="/servicios/editar/:id" element={<ServiciosForm />} />
        <Route path="*" element={<h2>Página no encontrada</h2>} />
      </Routes>
    </div>
  );
};

export default App;
