// src/pages/Centros/CentrosList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import centrosService from '../../services/centrosService';
import ConfirmModal from '../../components/ConfirmModal';
import 'bootstrap/dist/css/bootstrap.min.css';

const CentrosList = () => {
  const [centros, setCentros] = useState([]);
  const [centrosFiltrados, setCentrosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [centroToDelete, setCentroToDelete] = useState(null);
  const navigate = useNavigate();

  const fetchCentros = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await centrosService.getAll();
      setCentros(response.data);
      setCentrosFiltrados(response.data);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error al cargar centros:', err);
      setError('No se pudieron cargar los centros. Verifica que el servidor esté activo.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCentros();
  }, []);

  useEffect(() => {
    if (busqueda.trim() === '') {
      setCentrosFiltrados(centros);
    } else {
      const filtrados = centros.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.direccion && c.direccion.toLowerCase().includes(busqueda.toLowerCase()))
      );
      setCentrosFiltrados(filtrados);
    }
  }, [busqueda, centros]);

  const handleDelete = (id, nombre) => {
    setCentroToDelete({ id, nombre });
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!centroToDelete) return;

    try {
      await centrosService.delete(centroToDelete.id);
      setCentros(centros.filter(c => c._id !== centroToDelete.id));
      setSuccessMessage(`✅ Centro "${centroToDelete.nombre}" eliminado correctamente`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('❌ Error al eliminar centro:', err);
      const mensaje = err.response?.data?.error || 'No se pudo eliminar el centro. Puede tener datos relacionados.';
      setError(mensaje);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEdit = (id) => {
    navigate(`/centros/editar/${id}`);
  };

  return (
    <section className="admin-section-react">
      <div className="container mt-5 mb-5">
        <h2 className="mb-4 text-center title-main-react">
          <i className="bi bi-building-fill me-2 icon-spin"></i>
          Gestión de Centros
        </h2>

        <div className="mb-4">
          <Link to="/centros/nuevo" className="btn btn-nuevo-react">
            <i className="bi bi-plus-circle me-2"></i>
            Crear Centro
          </Link>
        </div>

        <div className="filtros-container-react mb-4">
          <div className="filtro-grupo-react busqueda-react">
            <label htmlFor="busqueda">
              <i className="bi bi-search"></i> Buscar:
            </label>
            <input
              type="text"
              id="busqueda"
              className="form-control"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o dirección..."
            />
          </div>

          <div className="resultados-count-react">
            <span className="badge bg-info-react">
              {centrosFiltrados.length} de {centros.length} centros
            </span>
          </div>
        </div>

        {successMessage && (
          <div className="alert alert-success-react alert-dismissible fade show" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger-react alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {loading && (
          <div className="empty-state-react">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando centros...</p>
          </div>
        )}

        {!loading && centrosFiltrados.length === 0 && centros.length === 0 && (
          <div className="empty-state-react">
            <div className="empty-icon-react">🏢</div>
            <h3>No hay centros registrados</h3>
            <p>Crea tu primer centro para comenzar</p>
          </div>
        )}

        {!loading && centrosFiltrados.length === 0 && centros.length > 0 && (
          <div className="empty-state-react">
            <div className="empty-icon-react">🔍</div>
            <h3>No se encontraron centros</h3>
            <p>No hay centros que coincidan con la búsqueda</p>
          </div>
        )}

        {!loading && centrosFiltrados.length > 0 && (
          <div className="table-wrapper-react">
            <table className="table-custom-react">
              <thead>
                <tr>
                  <th><i className="bi bi-building me-2"></i>Nombre</th>
                  <th><i className="bi bi-geo-alt me-2"></i>Dirección</th>
                  <th><i className="bi bi-telephone me-2"></i>Teléfono</th>
                  <th><i className="bi bi-envelope me-2"></i>Email</th>
                  <th><i className="bi bi-clock me-2"></i>Horario</th>
                  <th><i className="bi bi-gear me-2"></i>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {centrosFiltrados.map(centro => (
                  <tr key={centro._id} className="table-row-animated">
                    <td className="fw-bold">{centro.nombre}</td>
                    <td>{centro.direccion || 'Sin dirección'}</td>
                    <td>
                      {centro.telefono ? (
                        <a href={`tel:${centro.telefono}`} className="text-decoration-none">
                          <i className="bi bi-telephone-fill me-1"></i>
                          {centro.telefono}
                        </a>
                      ) : (
                        'Sin teléfono'
                      )}
                    </td>
                    <td>
                      {centro.email ? (
                        <a href={`mailto:${centro.email}`} className="text-decoration-none">
                          <i className="bi bi-envelope-fill me-1"></i>
                          {centro.email}
                        </a>
                      ) : (
                        'Sin email'
                      )}
                    </td>
                    <td>
                      <span className="badge bg-info text-dark">
                        {centro.horario_apertura || '09:00'} - {centro.horario_cierre || '20:00'}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/centros/${centro._id}`}
                        className="btn btn-sm btn-info-react me-2"
                        title="Ver detalle"
                      >
                        <i className="bi bi-eye"></i>
                      </Link>
                      <button
                        className="btn btn-sm btn-primary-react me-2"
                        onClick={() => handleEdit(centro._id)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger-react"
                        onClick={() => handleDelete(centro._id, centro.nombre)}
                        title="Eliminar"
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Centro"
        message={centroToDelete ? `¿Estás seguro de eliminar el centro "${centroToDelete.nombre}"?` : ''}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </section>
  );
};

export default CentrosList;
