// src/pages/ServiciosForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getServicioById, createServicio, updateServicio } from '../services/serviciosService';

const ServiciosForm = () => {
  const { id } = useParams(); // si hay id, estamos editando
  const navigate = useNavigate();

  const [servicio, setServicio] = useState({
    nombre: '',
    descripcion: '',
    precio: ''
  });

  const [errores, setErrores] = useState({});

  // Cargar datos si estamos editando
  useEffect(() => {
    if (id) {
      getServicioById(id)
        .then(servicio => setServicio(servicio))
        .catch(err => console.error('Error al cargar servicio:', err));
    }
  }, [id]);

  // Manejar cambios en inputs
  const handleChange = (e) => {
    setServicio({
      ...servicio,
      [e.target.name]: e.target.value
    });
  };

  // Validación simple
  const validar = () => {
    const nuevosErrores = {};
    if (!servicio.nombre.trim()) nuevosErrores.nombre = 'Nombre requerido';
    if (!servicio.precio || isNaN(servicio.precio)) nuevosErrores.precio = 'Precio válido requerido';
    return nuevosErrores;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validar();
    if (Object.keys(validationErrors).length > 0) {
      setErrores(validationErrors);
      return;
    }

    try {
      if (id) {
        await updateServicio(id, servicio);
        alert('Servicio actualizado ✅');
      } else {
        await createServicio(servicio);
        alert('Servicio creado ✅');
      }
      navigate('/servicios');
    } catch (err) {
      console.error('Error al guardar servicio:', err);
      alert('Error al guardar el servicio ❌');
    }
  };

  return (
    <div className="card p-4">
      <h2>{id ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            className={`form-control ${errores.nombre ? 'is-invalid' : ''}`}
            name="nombre"
            value={servicio.nombre}
            onChange={handleChange}
          />
          {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-control"
            name="descripcion"
            value={servicio.descripcion}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="mb-3">
          <label className="form-label">Precio</label>
          <input
            type="number"
            className={`form-control ${errores.precio ? 'is-invalid' : ''}`}
            name="precio"
            value={servicio.precio}
            onChange={handleChange}
          />
          {errores.precio && <div className="invalid-feedback">{errores.precio}</div>}
        </div>

        <button type="submit" className="btn btn-primary">
          {id ? 'Actualizar' : 'Crear'}
        </button>
      </form>
    </div>
  );
};

export default ServiciosForm;
