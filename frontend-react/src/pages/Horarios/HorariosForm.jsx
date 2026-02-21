// src/pages/Horarios/HorariosForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import horariosService from '../../services/horariosService.js';
import api from '../../services/api.js';
import 'bootstrap/dist/css/bootstrap.min.css';

const HorariosForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [horario, setHorario] = useState({
    profesional: '',
    dias: [],
    hora_inicio: '',
    hora_fin: '',
    festivo: false,
    fechas_festivas: []
  });

  const [nuevaFechaFestiva, setNuevaFechaFestiva] = useState('');

  const [profesionales, setProfesionales] = useState([]);
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Cargar profesionales
  useEffect(() => {
    const fetchProfesionales = async () => {
      try {
        const response = await api.get('/profesionales');
        setProfesionales(response.data);
      } catch (err) {
        console.error('Error al cargar profesionales:', err);
      }
    };
    fetchProfesionales();
  }, []);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (id) {
      setLoading(true);
      horariosService.getAll()
        .then(response => {
          const horarios = response.data;
          const horarioEncontrado = horarios.find(h => h._id === id);

          if (!horarioEncontrado) {
            setErrorMessage('Horario no encontrado');
            setLoading(false);
            return;
          }

          setHorario({
            profesional: horarioEncontrado.profesional?._id || horarioEncontrado.profesional || '',
            dias: horarioEncontrado.dias || [],
            hora_inicio: horarioEncontrado.hora_inicio || '',
            hora_fin: horarioEncontrado.hora_fin || '',
            festivo: horarioEncontrado.festivo || false,
            fechas_festivas: horarioEncontrado.fechas_festivas || []
          });
          setLoading(false);
        })
        .catch(err => {
          console.error('Error al cargar horario:', err);
          setErrorMessage('Error al cargar el horario');
          setLoading(false);
        });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHorario({
      ...horario,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errores[name]) {
      setErrores({
        ...errores,
        [name]: ''
      });
    }
  };

  const handleDiaChange = (dia) => {
    const diasActuales = [...horario.dias];
    const index = diasActuales.indexOf(dia);

    if (index > -1) {
      diasActuales.splice(index, 1);
    } else {
      diasActuales.push(dia);
    }

    setHorario({
      ...horario,
      dias: diasActuales
    });
  };

  const handleAgregarFechaFestiva = () => {
    if (!nuevaFechaFestiva) return;

    // Validar que se hayan seleccionado días de trabajo
    if (horario.dias.length === 0) {
      setErrorMessage('Primero debes seleccionar los días de trabajo del profesional');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Verificar que la fecha no esté ya agregada
    if (horario.fechas_festivas.includes(nuevaFechaFestiva)) {
      setErrorMessage('Esta fecha ya está agregada');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Obtener el día de la semana de la fecha seleccionada
    const fecha = new Date(nuevaFechaFestiva + 'T00:00:00');
    const diasSemanaES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaSemana = diasSemanaES[fecha.getDay()];

    // Validar que la fecha caiga en un día laborable del profesional
    if (!horario.dias.includes(diaSemana)) {
      setErrorMessage(`La fecha seleccionada (${diaSemana}) no coincide con los días de trabajo del profesional. Días laborables: ${horario.dias.join(', ')}`);
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    const nuevasFechas = [...horario.fechas_festivas, nuevaFechaFestiva];

    setHorario({
      ...horario,
      fechas_festivas: nuevasFechas,
      festivo: nuevasFechas.length > 0  // Actualizar festivo automáticamente
    });
    setNuevaFechaFestiva('');
  };

  const handleEliminarFechaFestiva = (fecha) => {
    const nuevasFechas = horario.fechas_festivas.filter(f => f !== fecha);

    setHorario({
      ...horario,
      fechas_festivas: nuevasFechas,
      festivo: nuevasFechas.length > 0  // Actualizar festivo automáticamente
    });
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!horario.profesional) {
      nuevosErrores.profesional = 'El profesional es obligatorio';
    }

    if (horario.dias.length === 0) {
      nuevosErrores.dias = 'Debes seleccionar al menos un día';
    }

    if (!horario.hora_inicio) {
      nuevosErrores.hora_inicio = 'La hora de inicio es obligatoria';
    }

    if (!horario.hora_fin) {
      nuevosErrores.hora_fin = 'La hora de fin es obligatoria';
    }

    if (horario.hora_inicio && horario.hora_fin && horario.hora_inicio >= horario.hora_fin) {
      nuevosErrores.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validar()) {
      return;
    }

    setGuardando(true);
    setErrorMessage('');
    setSuccessMessage('');

    const horarioData = {
      profesional: horario.profesional,
      dias: horario.dias,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      festivo: horario.fechas_festivas.length > 0,  // Calculado automáticamente
      fechas_festivas: horario.fechas_festivas
    };

    try {
      if (id) {
        await horariosService.update(id, horarioData);
        setSuccessMessage('✅ Horario actualizado correctamente');
      } else {
        await horariosService.create(horarioData);
        setSuccessMessage('✅ Horario creado correctamente');
      }

      setTimeout(() => {
        navigate('/horarios');
      }, 1500);
    } catch (error) {
      console.error('❌ Error al guardar horario:', error);

      // Capturar el mensaje de error específico del backend
      let mensajeError = 'Error al guardar el horario';

      if (error.response?.data?.error) {
        mensajeError = error.response.data.error;
      } else if (error.response?.data?.mensaje) {
        mensajeError = error.response.data.mensaje;
      } else if (error.message) {
        mensajeError = error.message;
      }

      setErrorMessage(mensajeError);
      setGuardando(false);

      // Scroll hacia arriba para ver el error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando horario...</p>
      </div>
    );
  }

  return (
    <section className="form-section-react d-flex justify-content-center align-items-center">
      <div className="form-card-react">
        <div className="form-header-react">
          <i className={`bi ${id ? 'bi-pencil-square' : 'bi-plus-circle-fill'} icon-bounce`}></i>
          <h2 className="fw-bold mb-2">
            {id ? 'Editar Horario' : 'Crear Nuevo Horario'}
          </h2>
          <p className="text-muted">
            {id ? 'Modifica el horario del profesional' : 'Añade un nuevo horario de trabajo'}
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
            <label htmlFor="profesional" className="form-label-react">
              <i className="bi bi-person-badge me-2"></i>
              Profesional *
            </label>
            <select
              id="profesional"
              name="profesional"
              className={`form-control form-control-custom-react ${errores.profesional ? 'is-invalid' : ''}`}
              value={horario.profesional}
              onChange={handleChange}
              required
              disabled={guardando || id} // Deshabilitar si está guardando O si estamos editando
            >
              <option value="">Seleccionar profesional</option>
              {profesionales.map(prof => (
                <option key={prof._id} value={prof._id}>
                  {prof.nombre} {prof.apellidos}
                </option>
              ))}
            </select>
            {id && (
              <small className="text-muted mt-2 d-block">
                <i className="bi bi-info-circle me-1"></i>
                No se puede cambiar el profesional de un horario existente
              </small>
            )}
            {errores.profesional && <div className="invalid-feedback-react">{errores.profesional}</div>}
            {errores.profesional && <div className="invalid-feedback-react">{errores.profesional}</div>}
          </div>

          <div className="mb-4">
            <label className="form-label-react">
              <i className="bi bi-calendar-week me-2"></i>
              Días de trabajo *
            </label>
            <div className="dias-checkbox-container">
              {diasSemana.map(dia => (
                <div key={dia} className="form-check form-check-inline">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`dia-${dia}`}
                    checked={horario.dias.includes(dia)}
                    onChange={() => handleDiaChange(dia)}
                    disabled={guardando}
                  />
                  <label className="form-check-label" htmlFor={`dia-${dia}`}>
                    {dia}
                  </label>
                </div>
              ))}
            </div>
            {errores.dias && <div className="text-danger mt-2">{errores.dias}</div>}
          </div>

          <div className="row mb-4">
            <div className="col-md-6 mb-3 mb-md-0">
              <label htmlFor="hora_inicio" className="form-label-react">
                <i className="bi bi-clock me-2"></i>
                Hora de inicio *
              </label>
              <input
                type="time"
                id="hora_inicio"
                name="hora_inicio"
                className={`form-control form-control-custom-react ${errores.hora_inicio ? 'is-invalid' : ''}`}
                value={horario.hora_inicio}
                onChange={handleChange}
                required
                disabled={guardando}
              />
              {errores.hora_inicio && <div className="invalid-feedback-react">{errores.hora_inicio}</div>}
            </div>

            <div className="col-md-6">
              <label htmlFor="hora_fin" className="form-label-react">
                <i className="bi bi-clock-fill me-2"></i>
                Hora de fin *
              </label>
              <input
                type="time"
                id="hora_fin"
                name="hora_fin"
                className={`form-control form-control-custom-react ${errores.hora_fin ? 'is-invalid' : ''}`}
                value={horario.hora_fin}
                onChange={handleChange}
                required
                disabled={guardando}
              />
              {errores.hora_fin && <div className="invalid-feedback-react">{errores.hora_fin}</div>}
            </div>
          </div>

          {/* Fechas festivas */}
          <div className="mb-4">
            <label className="form-label-react">
              <i className="bi bi-calendar-event me-2"></i>
              Fechas festivas específicas
            </label>
            <small className="text-muted-react d-block mb-2">
              Solo puedes agregar fechas que correspondan a los días de trabajo seleccionados
            </small>
            <div className="input-group">
              <input
                type="date"
                className="form-control form-control-custom-react"
                value={nuevaFechaFestiva}
                onChange={(e) => setNuevaFechaFestiva(e.target.value)}
                disabled={guardando}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAgregarFechaFestiva}
                disabled={guardando}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Agregar
              </button>
            </div>
            <div className="mt-2">
              {horario.fechas_festivas.map(fecha => (
                <div key={fecha} className="alert alert-secondary alert-dismissible fade show d-flex align-items-center" role="alert">
                  <i className="bi bi-calendar-check me-2"></i>
                  {new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(fecha))}
                  <button
                    type="button"
                    className="btn-close ms-auto"
                    onClick={() => handleEliminarFechaFestiva(fecha)}
                    disabled={guardando}
                  ></button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions-react">
            <button
              type="button"
              onClick={() => navigate('/horarios')}
              className="btn-cancel-react"
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
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  {id ? 'Actualizar Horario' : 'Crear Horario'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default HorariosForm;
