// src/pages/Centros/CentrosForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import centrosService from '../../services/centrosService';
import 'bootstrap/dist/css/bootstrap.min.css';

const CentrosForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [centro, setCentro] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    horario_apertura: '09:00',
    horario_cierre: '20:00'
  });

  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar datos si estamos editando
  useEffect(() => {
    if (id) {
      setLoading(true);
      centrosService.getById(id)
        .then(response => {
          const data = response.data;
          setCentro({
            nombre: data.nombre || '',
            direccion: data.direccion || '',
            telefono: data.telefono || '',
            email: data.email || '',
            horario_apertura: data.horario_apertura || '09:00',
            horario_cierre: data.horario_cierre || '20:00'
          });
          setLoading(false);
        })
        .catch(err => {
          console.error('Error al cargar centro:', err);
          setErrorMessage('Error al cargar el centro');
          setLoading(false);
        });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCentro({
      ...centro,
      [name]: value
    });
    if (errores[name]) {
      setErrores({
        ...errores,
        [name]: ''
      });
    }
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!centro.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (!centro.direccion.trim()) {
      nuevosErrores.direccion = 'La dirección es obligatoria';
    }

    if (centro.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(centro.email)) {
      nuevosErrores.email = 'El email no es válido';
    }

    if (centro.telefono && !/^\d{9}$/.test(centro.telefono.replace(/\s/g, ''))) {
      nuevosErrores.telefono = 'El teléfono debe tener 9 dígitos';
    }

    return nuevosErrores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const validationErrors = validar();
    if (Object.keys(validationErrors).length > 0) {
      setErrores(validationErrors);
      return;
    }

    setGuardando(true);

    try {
      const centroData = {
        nombre: centro.nombre.trim(),
        direccion: centro.direccion.trim(),
        telefono: centro.telefono.trim(),
        email: centro.email.trim(),
        horario_apertura: centro.horario_apertura,
        horario_cierre: centro.horario_cierre
      };

      if (id) {
        await centrosService.update(id, centroData);
        setSuccessMessage('✅ ¡Centro actualizado correctamente!');
      } else {
        await centrosService.create(centroData);
        setSuccessMessage('✅ ¡Centro creado correctamente!');
      }

      setGuardando(false);
      setTimeout(() => {
        navigate('/centros');
      }, 1500);

    } catch (err) {
      console.error('Error al guardar centro:', err);
      setErrorMessage(err.response?.data?.error || 'Error al guardar el centro. Inténtalo de nuevo.');
      setGuardando(false);
    }
  };

  const cancelar = () => {
    navigate('/centros');
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando centro...</p>
      </div>
    );
  }

  return (
    <section className="form-section-react d-flex justify-content-center align-items-center">
      <div className="form-card-react">
        <div className="form-header-react">
          <i className={`bi ${id ? 'bi-pencil-square' : 'bi-plus-circle-fill'} icon-bounce`}></i>
          <h2 className="fw-bold mb-2">
            {id ? 'Editar Centro' : 'Crear Nuevo Centro'}
          </h2>
          <p className="text-muted">
            {id ? 'Modifica los datos del centro' : 'Añade un nuevo centro a la red'}
          </p>
        </div>

        {/* Alertas */}
        {successMessage && (
          <div className="alert alert-success-react-form alert-dismissible fade show" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger-react-form alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMessage}
            <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label-react">
              <i className="bi bi-building me-2"></i>Nombre del Centro
            </label>
            <input
              type="text"
              className={`form-control form-control-custom-react ${errores.nombre ? 'is-invalid' : ''}`}
              name="nombre"
              value={centro.nombre}
              onChange={handleChange}
              placeholder="Ej: Glamour Studio Centro"
              disabled={guardando}
            />
            {errores.nombre && <div className="invalid-feedback-react">{errores.nombre}</div>}
          </div>

          <div className="mb-4">
            <label className="form-label-react">
              <i className="bi bi-geo-alt me-2"></i>Dirección
            </label>
            <input
              type="text"
              className={`form-control form-control-custom-react ${errores.direccion ? 'is-invalid' : ''}`}
              name="direccion"
              value={centro.direccion}
              onChange={handleChange}
              placeholder="Ej: Calle Principal 123, Madrid"
              disabled={guardando}
            />
            {errores.direccion && <div className="invalid-feedback-react">{errores.direccion}</div>}
          </div>

          <div className="row mb-4">
            <div className="col-md-6 mb-3 mb-md-0">
              <label className="form-label-react">
                <i className="bi bi-telephone me-2"></i>Teléfono
              </label>
              <input
                type="tel"
                className={`form-control form-control-custom-react ${errores.telefono ? 'is-invalid' : ''}`}
                name="telefono"
                value={centro.telefono}
                onChange={handleChange}
                placeholder="Ej: 912345678"
                disabled={guardando}
              />
              {errores.telefono && <div className="invalid-feedback-react">{errores.telefono}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label-react">
                <i className="bi bi-envelope me-2"></i>Email
              </label>
              <input
                type="email"
                className={`form-control form-control-custom-react ${errores.email ? 'is-invalid' : ''}`}
                name="email"
                value={centro.email}
                onChange={handleChange}
                placeholder="Ej: centro@hairgest.com"
                disabled={guardando}
              />
              {errores.email && <div className="invalid-feedback-react">{errores.email}</div>}
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-6 mb-3 mb-md-0">
              <label className="form-label-react">
                <i className="bi bi-clock me-2"></i>Horario Apertura
              </label>
              <input
                type="time"
                className="form-control form-control-custom-react"
                name="horario_apertura"
                value={centro.horario_apertura}
                onChange={handleChange}
                disabled={guardando}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-react">
                <i className="bi bi-clock-fill me-2"></i>Horario Cierre
              </label>
              <input
                type="time"
                className="form-control form-control-custom-react"
                name="horario_cierre"
                value={centro.horario_cierre}
                onChange={handleChange}
                disabled={guardando}
              />
            </div>
          </div>

          <div className="form-actions-react">
            <button
              type="button"
              className="btn-cancel-react"
              onClick={cancelar}
              disabled={guardando}
            >
              <i className="bi bi-x-circle me-2"></i>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit-react"
              disabled={guardando}
            >
              {guardando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  {id ? 'Actualizar Centro' : 'Crear Centro'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CentrosForm;
