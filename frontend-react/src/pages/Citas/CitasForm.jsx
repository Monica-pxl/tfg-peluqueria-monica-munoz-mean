// src/pages/Citas/CitasForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import citasService from '../../services/citasService';
import api from '../../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';

const CitasForm = () => {
  const navigate = useNavigate();

  const [cita, setCita] = useState({
    usuario: '',
    profesional: '',
    servicio: '',
    centro: '',
    fecha: '',
    hora: ''
  });

  const [usuarios, setUsuarios] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [centros, setCentros] = useState([]);
  const [serviciosFiltrados, setServiciosFiltrados] = useState([]);
  const [profesionalesFiltrados, setProfesionalesFiltrados] = useState([]);
  const [horarioProfesional, setHorarioProfesional] = useState(null);
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usuariosRes, profesionalesRes, serviciosRes, centrosRes] = await Promise.all([
          api.get('/usuarios'),
          api.get('/profesionales'),
          api.get('/servicios'),
          api.get('/centros')
        ]);

        setUsuarios(usuariosRes.data.filter(u => u.rol === 'cliente'));
        setProfesionales(profesionalesRes.data);
        setServicios(serviciosRes.data);
        setCentros(centrosRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setErrorMessage('Error al cargar los datos necesarios');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Función para verificar si una fecha es laborable
  const esFechaValida = (fecha) => {
    if (!horarioProfesional) {
      console.log('❌ No hay horario del profesional');
      return false;
    }

    console.log('📅 Validando fecha:', fecha);
    console.log('🕒 Horario profesional:', horarioProfesional);

    const fechaObj = new Date(fecha + 'T00:00:00');
    const diaSemana = fechaObj.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado

    console.log('📆 Día de la semana (número):', diaSemana);

    // Verificar si es festivo
    if (horarioProfesional.festivo && horarioProfesional.fechas_festivas) {
      const esFestivo = horarioProfesional.fechas_festivas.some(f => {
        const fechaFestiva = new Date(f + 'T00:00:00');
        return fechaFestiva.getTime() === fechaObj.getTime();
      });
      if (esFestivo) {
        console.log('❌ Es un día festivo');
        return false;
      }
    }

    // Verificar si el día de la semana está en el horario
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const nombreDia = diasSemana[diaSemana];

    console.log('📝 Nombre del día:', nombreDia);
    console.log('📋 Días laborables del profesional:', horarioProfesional.dias);

    if (Array.isArray(horarioProfesional.dias)) {
      // Normalizar días (quitar acentos y convertir a minúsculas)
      const diasNormalizados = horarioProfesional.dias.map(d =>
        d.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
      );

      const nombreDiaNormalizado = nombreDia
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      console.log('🔍 Días normalizados:', diasNormalizados);
      console.log('🔍 Día a buscar normalizado:', nombreDiaNormalizado);

      const resultado = diasNormalizados.includes(nombreDiaNormalizado);
      console.log(resultado ? '✅ Fecha válida' : '❌ Fecha no válida');

      return resultado;
    }

    console.log('❌ horarioProfesional.dias no es un array');
    return false;
  };

  // Función para generar horas disponibles
  const generarHorasDisponibles = async (fecha) => {
    if (!horarioProfesional) {
      setHorasDisponibles([]);
      return;
    }

    const horaInicio = horarioProfesional.hora_inicio || '09:00';
    const horaFin = horarioProfesional.hora_fin || '20:00';

    // Generar slots de 30 minutos
    const horas = [];
    let [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    let [horaFinH, horaFinM] = horaFin.split(':').map(Number);

    let horaActual = horaInicioH * 60 + horaInicioM;
    const horaFinMinutos = horaFinH * 60 + horaFinM;

    while (horaActual < horaFinMinutos) {
      const h = Math.floor(horaActual / 60);
      const m = horaActual % 60;
      const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      horas.push(horaStr);
      horaActual += 30; // Intervalos de 30 minutos
    }

    // Obtener servicio seleccionado para conocer su duración
    const servicioSeleccionado = servicios.find(s => s._id === cita.servicio);
    const duracionServicio = servicioSeleccionado ? servicioSeleccionado.duracion : 30;

    console.log('⏱️ Duración del servicio seleccionado:', duracionServicio, 'minutos');

    // Obtener citas existentes del profesional en esa fecha
    try {
      const response = await api.get('/citas');
      const todasCitas = response.data;

      const citasDelDia = todasCitas.filter(c => {
        const profesionalId = typeof c.profesional === 'object' && c.profesional !== null
          ? c.profesional._id
          : c.profesional;

        return profesionalId === cita.profesional &&
               c.fecha === fecha &&
               c.estado !== 'cancelada';
      });

      console.log('📋 Citas existentes en', fecha, ':', citasDelDia.length);

      // Filtrar horas considerando solapamientos
      const horasDisponibles = horas.filter(horaSlot => {
        // Convertir hora del slot a minutos
        const [hSlot, mSlot] = horaSlot.split(':').map(Number);
        const slotInicioMin = hSlot * 60 + mSlot;
        const slotFinMin = slotInicioMin + duracionServicio; // Fin de la nueva cita

        // Verificar si el slot se solapa con alguna cita existente
        const haySolapamiento = citasDelDia.some(citaExistente => {
          // Obtener duración del servicio de la cita existente
          let duracionCitaExistente = 30; // Default

          if (citaExistente.servicio) {
            const servicioExistente = servicios.find(s => {
              const servicioId = typeof citaExistente.servicio === 'object' && citaExistente.servicio !== null
                ? citaExistente.servicio._id
                : citaExistente.servicio;
              return s._id === servicioId;
            });

            if (servicioExistente && servicioExistente.duracion) {
              duracionCitaExistente = servicioExistente.duracion;
            }
          }

          // Calcular inicio y fin de la cita existente en minutos
          const [hCita, mCita] = citaExistente.hora.split(':').map(Number);
          const citaInicioMin = hCita * 60 + mCita;
          const citaFinMin = citaInicioMin + duracionCitaExistente;

          // Verificar solapamiento:
          // Hay solapamiento si:
          // 1. El nuevo slot empieza antes de que termine la cita existente Y
          // 2. El nuevo slot termina después de que empiece la cita existente
          const solapa = slotInicioMin < citaFinMin && slotFinMin > citaInicioMin;

          if (solapa) {
            console.log(`🚫 Bloqueado ${horaSlot}: se solapa con cita existente ${citaExistente.hora}-${Math.floor(citaFinMin/60)}:${(citaFinMin%60).toString().padStart(2, '0')}`);
          }

          return solapa;
        });

        return !haySolapamiento;
      });

      console.log('✅ Horas disponibles:', horasDisponibles.length);
      setHorasDisponibles(horasDisponibles);
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      setHorasDisponibles(horas);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    // Si cambia el centro, filtrar servicios
    if (name === 'centro') {
      const centroId = value;

      // Filtrar servicios del centro seleccionado
      const serviciosDelCentro = servicios.filter(s => {
        if (typeof s.centro === 'object' && s.centro !== null) {
          return s.centro._id === centroId;
        }
        return s.centro === centroId;
      });
      setServiciosFiltrados(serviciosDelCentro);

      // Resetear servicio, profesional, fecha y hora
      setCita({
        ...cita,
        centro: value,
        servicio: '',
        profesional: '',
        fecha: '',
        hora: ''
      });
      setProfesionalesFiltrados([]);
      setHorarioProfesional(null);
      setHorasDisponibles([]);
    }
    // Si cambia el servicio, filtrar profesionales que ofrecen ese servicio
    else if (name === 'servicio') {
      const servicioId = value;

      if (servicioId) {
        try {
          // Obtener profesionales que ofrecen este servicio
          const response = await api.get('/profesional_servicio');
          const relaciones = response.data;

          // Filtrar relaciones por servicio
          const relacionesDelServicio = relaciones.filter(rel => {
            if (typeof rel.servicio === 'object' && rel.servicio !== null) {
              return rel.servicio._id === servicioId;
            }
            return rel.servicio === servicioId;
          });

          // Obtener IDs de profesionales
          const idsProfesionales = relacionesDelServicio.map(rel => {
            if (typeof rel.profesional === 'object' && rel.profesional !== null) {
              return rel.profesional._id;
            }
            return rel.profesional;
          });

          // Filtrar profesionales
          const profesionalesDelServicio = profesionales.filter(p =>
            idsProfesionales.includes(p._id)
          );

          setProfesionalesFiltrados(profesionalesDelServicio);

          // Resetear profesional, fecha y hora
          setCita({
            ...cita,
            servicio: value,
            profesional: '',
            fecha: '',
            hora: ''
          });
          setHorarioProfesional(null);
          setHorasDisponibles([]);
        } catch (error) {
          console.error('Error al filtrar profesionales:', error);
          setProfesionalesFiltrados([]);
        }
      } else {
        setProfesionalesFiltrados([]);
        setCita({
          ...cita,
          servicio: value,
          profesional: '',
          fecha: '',
          hora: ''
        });
        setHorarioProfesional(null);
        setHorasDisponibles([]);
      }
    }
    // Si cambia el profesional, cargar su horario
    else if (name === 'profesional') {
      if (value) {
        try {
          // Obtener horarios del profesional
          const response = await api.get('/horarios');
          const todosHorarios = response.data;

          // Filtrar por profesional
          const horarioProf = todosHorarios.find(h => {
            if (typeof h.profesional === 'object' && h.profesional !== null) {
              return h.profesional._id === value;
            }
            return h.profesional === value;
          });

          setHorarioProfesional(horarioProf);

          // Resetear fecha y hora
          setCita({
            ...cita,
            profesional: value,
            fecha: '',
            hora: ''
          });
          setHorasDisponibles([]);
        } catch (error) {
          console.error('Error al cargar horario:', error);
          setHorarioProfesional(null);
        }
      } else {
        setHorarioProfesional(null);
        setCita({
          ...cita,
          profesional: value,
          fecha: '',
          hora: ''
        });
        setHorasDisponibles([]);
      }
    }
    // Si cambia la fecha, generar horas disponibles
    else if (name === 'fecha') {
      if (value && horarioProfesional) {
        await generarHorasDisponibles(value);
        setCita({
          ...cita,
          fecha: value,
          hora: ''
        });
      } else {
        setCita({
          ...cita,
          fecha: value,
          hora: ''
        });
        setHorasDisponibles([]);
      }
    }
    else {
      setCita({
        ...cita,
        [name]: value
      });
    }

    if (errores[name]) {
      setErrores({
        ...errores,
        [name]: ''
      });
    }
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!cita.usuario) {
      nuevosErrores.usuario = 'Debe seleccionar un cliente';
    }

    if (!cita.profesional) {
      nuevosErrores.profesional = 'Debe seleccionar un profesional';
    }

    if (!cita.servicio) {
      nuevosErrores.servicio = 'Debe seleccionar un servicio';
    }

    if (!cita.centro) {
      nuevosErrores.centro = 'Debe seleccionar un centro';
    }

    if (!cita.fecha) {
      nuevosErrores.fecha = 'La fecha es obligatoria';
    } else {
      const fechaSeleccionada = new Date(cita.fecha + 'T00:00:00');
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaSeleccionada < hoy) {
        nuevosErrores.fecha = 'La fecha no puede ser anterior a hoy';
      } else if (horarioProfesional && !esFechaValida(cita.fecha)) {
        nuevosErrores.fecha = 'El profesional no trabaja en esta fecha';
      }
    }

    if (!cita.hora) {
      nuevosErrores.hora = 'La hora es obligatoria';
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
      const citaData = {
        usuario: cita.usuario,
        profesional: cita.profesional,
        servicio: cita.servicio,
        centro: cita.centro,
        fecha: cita.fecha,
        hora: cita.hora,
        estado: 'pendiente'
      };

      await citasService.create(citaData);
      setSuccessMessage('✅ ¡Cita creada correctamente!');
      setGuardando(false);

      setTimeout(() => {
        navigate('/citas');
      }, 1500);

    } catch (err) {
      console.error('Error al guardar cita:', err);
      setErrorMessage(err.response?.data?.error || 'Error al guardar la cita. Inténtalo de nuevo.');
      setGuardando(false);
    }
  };

  const cancelar = () => {
    navigate('/citas');
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando datos...</p>
      </div>
    );
  }

  return (
    <section className="form-section-react d-flex justify-content-center align-items-center">
      <div className="form-card-react">
        <div className="form-header-react">
          <i className="bi bi-calendar-plus-fill icon-bounce"></i>
          <h2 className="fw-bold mb-2">Nueva Cita</h2>
          <p className="text-muted">Reserva una nueva cita para un cliente</p>
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
              <i className="bi bi-person me-2"></i>Cliente
            </label>
            <select
              className={`form-select form-control-custom-react ${errores.usuario ? 'is-invalid' : ''}`}
              name="usuario"
              value={cita.usuario}
              onChange={handleChange}
              disabled={guardando}
            >
              <option value="">Selecciona un cliente</option>
              {usuarios.map(usuario => (
                <option key={usuario._id} value={usuario._id}>
                  {usuario.nombre} - {usuario.email}
                </option>
              ))}
            </select>
            {errores.usuario && <div className="invalid-feedback-react">{errores.usuario}</div>}
          </div>

          <div className="mb-4">
            <label className="form-label-react">
              <i className="bi bi-building me-2"></i>Centro
            </label>
            <select
              className={`form-select form-control-custom-react ${errores.centro ? 'is-invalid' : ''}`}
              name="centro"
              value={cita.centro}
              onChange={handleChange}
              disabled={guardando}
            >
              <option value="">Selecciona un centro</option>
              {centros.map(centro => (
                <option key={centro._id} value={centro._id}>
                  {centro.nombre}
                </option>
              ))}
            </select>
            {errores.centro && <div className="invalid-feedback-react">{errores.centro}</div>}
          </div>

          <div className="mb-4">
            <label className="form-label-react">
              <i className="bi bi-scissors me-2"></i>Servicio
            </label>
            <select
              className={`form-select form-control-custom-react ${errores.servicio ? 'is-invalid' : ''}`}
              name="servicio"
              value={cita.servicio}
              onChange={handleChange}
              disabled={guardando || !cita.centro}
            >
              <option value="">
                {!cita.centro ? 'Primero selecciona un centro' : 'Selecciona un servicio'}
              </option>
              {serviciosFiltrados.map(servicio => (
                <option key={servicio._id} value={servicio._id}>
                  {servicio.nombre} - {servicio.duracion}min - €{servicio.precio}
                </option>
              ))}
            </select>
            {errores.servicio && <div className="invalid-feedback-react">{errores.servicio}</div>}
            {cita.centro && serviciosFiltrados.length === 0 && (
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Este centro no tiene servicios disponibles
              </small>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label-react">
              <i className="bi bi-person-badge me-2"></i>Profesional
            </label>
            <select
              className={`form-select form-control-custom-react ${errores.profesional ? 'is-invalid' : ''}`}
              name="profesional"
              value={cita.profesional}
              onChange={handleChange}
              disabled={guardando || !cita.servicio}
            >
              <option value="">
                {!cita.servicio ? 'Primero selecciona un servicio' : 'Selecciona un profesional'}
              </option>
              {profesionalesFiltrados.map(prof => (
                <option key={prof._id} value={prof._id}>
                  {prof.nombre} {prof.apellidos}
                </option>
              ))}
            </select>
            {errores.profesional && <div className="invalid-feedback-react">{errores.profesional}</div>}
            {cita.servicio && profesionalesFiltrados.length === 0 && (
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Este servicio no tiene profesionales disponibles
              </small>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label-react">
              <i className="bi bi-calendar-event me-2"></i>Fecha
            </label>
            <input
              type="date"
              className={`form-control form-control-custom-react ${errores.fecha ? 'is-invalid' : ''}`}
              name="fecha"
              value={cita.fecha}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              disabled={guardando || !cita.profesional}
            />
            {errores.fecha && <div className="invalid-feedback-react">{errores.fecha}</div>}
            {!cita.profesional && (
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Selecciona un profesional primero
              </small>
            )}
            {cita.profesional && horarioProfesional && (
              <small className="text-info">
                <i className="bi bi-info-circle me-1"></i>
                Días laborables: {horarioProfesional.dias?.join(', ')}
              </small>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label-react">
              <i className="bi bi-clock me-2"></i>Hora
            </label>
            <select
              className={`form-select form-control-custom-react ${errores.hora ? 'is-invalid' : ''}`}
              name="hora"
              value={cita.hora}
              onChange={handleChange}
              disabled={guardando || !cita.fecha}
            >
              <option value="">
                {!cita.fecha ? 'Primero selecciona una fecha' : 'Selecciona una hora'}
              </option>
              {horasDisponibles.map(hora => (
                <option key={hora} value={hora}>
                  {hora}
                </option>
              ))}
            </select>
            {errores.hora && <div className="invalid-feedback-react">{errores.hora}</div>}
            {!cita.fecha && (
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Selecciona una fecha primero
              </small>
            )}
            {cita.fecha && horasDisponibles.length === 0 && (
              <small className="text-danger">
                <i className="bi bi-exclamation-circle me-1"></i>
                No hay horas disponibles para esta fecha
              </small>
            )}
            {cita.fecha && horasDisponibles.length > 0 && (
              <small className="text-success">
                <i className="bi bi-check-circle me-1"></i>
                {horasDisponibles.length} horas disponibles (intervalos de 30 min)
              </small>
            )}
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
                  Crear Cita
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CitasForm;
