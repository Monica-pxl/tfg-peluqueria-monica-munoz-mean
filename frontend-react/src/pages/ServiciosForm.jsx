// src/pages/ServiciosForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getServicioById, createServicio, updateServicio } from '../services/serviciosService';
import api from '../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';

const ServiciosForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [servicio, setServicio] = useState({
    nombre: '',
    descripcion: '',
    duracion: '',
    precio: '',
    centro: '',
    imagen: ''
  });

  const [centros, setCentros] = useState([]);
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar centros
  useEffect(() => {
    const fetchCentros = async () => {
      try {
        const response = await api.get('/centros');
        setCentros(response.data);
      } catch (err) {
        console.error('Error al cargar centros:', err);
      }
    };
    fetchCentros();
  }, []);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (id) {
      setLoading(true);
      getServicioById(id)
        .then(data => {
          setServicio({
            nombre: data.nombre || '',
            descripcion: data.descripcion || '',
            duracion: data.duracion || '',
            precio: data.precio || '',
            centro: data.centro || '',
            imagen: data.imagen || ''
          });
          setLoading(false);
        })
        .catch(err => {
          console.error('Error al cargar servicio:', err);
          setErrorMessage('Error al cargar el servicio');
          setLoading(false);
        });
    }
  }, [id]);

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setServicio({
      ...servicio,
      [name]: value
    });
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errores[name]) {
      setErrores({
        ...errores,
        [name]: ''
      });
    }
  };

  // Validación completa
  const validar = () => {
    const nuevosErrores = {};

    if (!servicio.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (!servicio.precio || isNaN(servicio.precio) || Number(servicio.precio) <= 0) {
      nuevosErrores.precio = 'El precio debe ser mayor a 0';
    }

    if (!servicio.centro) {
      nuevosErrores.centro = 'Debe seleccionar un centro';
    }

    if (servicio.duracion && (isNaN(servicio.duracion) || Number(servicio.duracion) <= 0)) {
      nuevosErrores.duracion = 'La duración debe ser un número positivo';
    }

    return nuevosErrores;
  };

  // Enviar formulario
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
      const servicioData = {
        nombre: servicio.nombre.trim(),
        descripcion: servicio.descripcion.trim(),
        duracion: servicio.duracion ? Number(servicio.duracion) : undefined,
        precio: Number(servicio.precio),
        centro: servicio.centro,
        imagen: servicio.imagen.trim()
      };

      if (id) {
        await updateServicio(id, servicioData);
        setSuccessMessage('✅ ¡Servicio actualizado correctamente!');
      } else {
        await createServicio(servicioData);
        setSuccessMessage('✅ ¡Servicio creado correctamente!');
      }

      setGuardando(false);
      setTimeout(() => {
        navigate('/servicios');
      }, 1500);

    } catch (err) {
      console.error('Error al guardar servicio:', err);
      setErrorMessage(err.response?.data?.mensaje || 'Error al guardar el servicio. Inténtalo de nuevo.');
      setGuardando(false);
    }
  };

  const cancelar = () => {
    navigate('/servicios');
  };

  return (
    <section className="form-section-react d-flex justify-content-center align-items-center">
      <div className="form-card-react">
        <div className="form-header-react">
          <i className={`bi ${id ? 'bi-pencil-square' : 'bi-plus-circle-fill'} icon-bounce`}></i>
          <h2 className="fw-bold mb-2">
            {id ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
          </h2>
          <p className="text-muted">
            {id ? 'Modifica los datos del servicio' : 'Añade un nuevo servicio al catálogo'}
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

        {loading && !successMessage && (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label-react">
              <i className="bi bi-scissors me-2"></i>Nombre del Servicio
            </label>
            <input
              type="text"
              className={`form-control form-control-custom-react ${errores.nombre ? 'is-invalid' : ''}`}
              name="nombre"
              value={servicio.nombre}
              onChange={handleChange}
              placeholder="Ej: Corte de pelo, Tinte, Manicura..."
              disabled={loading || guardando}
            />
            {errores.nombre && <div className="invalid-feedback-react">{errores.nombre}</div>}
          </div>

          <div className="mb-4">
            <label className="form-label-react">
              <i className="bi bi-card-text me-2"></i>Descripción
            </label>
            <textarea
              className="form-control form-control-custom-react"
              name="descripcion"
              value={servicio.descripcion}
              onChange={handleChange}
              rows="3"
              placeholder="Describe brevemente el servicio..."
              disabled={loading || guardando}
            ></textarea>
          </div>

          <div className="row mb-4">
            <div className="col-md-4 mb-3 mb-md-0">
              <label className="form-label-react">
                <i className="bi bi-clock-fill me-2"></i>Duración (min)
              </label>
              <input
                type="number"
                className={`form-control form-control-custom-react ${errores.duracion ? 'is-invalid' : ''}`}
                name="duracion"
                value={servicio.duracion}
                onChange={handleChange}
                placeholder="30"
                min="1"
                disabled={loading || guardando}
              />
              {errores.duracion && <div className="invalid-feedback-react">{errores.duracion}</div>}
            </div>

            <div className="col-md-4 mb-3 mb-md-0">
              <label className="form-label-react">
                <i className="bi bi-currency-euro me-2"></i>Precio (€)
              </label>
              <input
                type="number"
                className={`form-control form-control-custom-react ${errores.precio ? 'is-invalid' : ''}`}
                name="precio"
                value={servicio.precio}
                onChange={handleChange}
                placeholder="25.00"
                min="0.01"
                step="0.01"
                disabled={loading || guardando}
              />
              {errores.precio && <div className="invalid-feedback-react">{errores.precio}</div>}
            </div>

            <div className="col-md-4">
              <label className="form-label-react">
                <i className="bi bi-geo-alt-fill me-2"></i>Centro
              </label>
              <select
                className={`form-select form-control-custom-react ${errores.centro ? 'is-invalid' : ''}`}
                name="centro"
                value={servicio.centro}
                onChange={handleChange}
                disabled={loading || guardando}
              >
                <option value="">Selecciona centro</option>
                {centros.map(centro => (
                  <option key={centro._id} value={centro._id}>
                    {centro.nombre}
                  </option>
                ))}
              </select>
              {errores.centro && <div className="invalid-feedback-react">{errores.centro}</div>}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label-react">
              <i className="bi bi-image-fill me-2"></i>URL de la Imagen
            </label>
            <input
              type="url"
              className="form-control form-control-custom-react"
              name="imagen"
              value={servicio.imagen}
              onChange={handleChange}
              placeholder="https://ejemplo.com/imagen.jpg"
              disabled={loading || guardando}
            />
            <small className="text-muted-react d-block mt-2">
              <i className="bi bi-info-circle me-1"></i>Opcional: URL de la imagen del servicio
            </small>
          </div>

          <div className="form-actions-react">
            <button
              type="button"
              className="btn btn-cancel-react"
              onClick={cancelar}
              disabled={guardando}
            >
              <i className="bi bi-x-circle me-2"></i>Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-create-react"
              disabled={guardando}
            >
              <i className="bi bi-check-circle me-2"></i>
              {guardando ? 'Guardando...' : id ? 'Actualizar Servicio' : 'Crear Servicio'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ServiciosForm;





