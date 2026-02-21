// src/components/ConfirmModal.jsx
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const ConfirmModal = ({
  show,
  onHide,
  onConfirm,
  title = '¿Estás seguro?',
  message = '¿Deseas continuar con esta acción?',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  type = 'danger' // danger, warning, primary
}) => {
  if (!show) return null;

  const handleConfirm = () => {
    onConfirm();
    onHide();
  };

  // Configuración de iconos y colores según el tipo
  const config = {
    danger: {
      icon: 'bi-exclamation-triangle-fill',
      bgColor: 'bg-danger',
      textColor: 'text-danger',
      btnClass: 'btn-danger'
    },
    warning: {
      icon: 'bi-exclamation-circle-fill',
      bgColor: 'bg-warning',
      textColor: 'text-warning',
      btnClass: 'btn-warning'
    },
    primary: {
      icon: 'bi-info-circle-fill',
      bgColor: 'bg-primary',
      textColor: 'text-primary',
      btnClass: 'btn-primary'
    }
  };

  const currentConfig = config[type] || config.danger;

  return (
    <>
      {/* Backdrop con animación */}
      <div
        className="modal-backdrop fade show"
        style={{
          zIndex: 1050,
          backgroundColor: 'rgba(0, 0, 0, 0.6)'
        }}
        onClick={onHide}
      ></div>

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1055 }}
        onClick={onHide}
      >
        <div
          className="modal-dialog modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: 'modalSlideIn 0.3s ease-out',
            maxWidth: '420px'
          }}
        >
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '0.75rem', overflow: 'hidden' }}>

            {/* Header elegante con gradiente */}
            <div className={`modal-header ${currentConfig.bgColor} bg-gradient text-white border-0 py-3`}>
              <h5 className="modal-title d-flex align-items-center fw-bold mb-0">
                <span
                  className="d-flex align-items-center justify-content-center me-2"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <i className={`bi ${currentConfig.icon}`} style={{ fontSize: '1.1rem' }}></i>
                </span>
                <span style={{ fontSize: '1.1rem' }}>{title}</span>
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white opacity-75"
                onClick={onHide}
                aria-label="Close"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.5rem'
                }}
              ></button>
            </div>

            {/* Body con mejor espaciado */}
            <div className="modal-body p-4 text-center">
              <div className="mb-3">
                <div
                  className={`d-inline-flex align-items-center justify-content-center mb-3 ${currentConfig.textColor}`}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: type === 'danger' ? 'rgba(220, 53, 69, 0.1)' :
                                    type === 'warning' ? 'rgba(255, 193, 7, 0.1)' :
                                    'rgba(13, 110, 253, 0.1)',
                    animation: 'iconPulse 2s ease-in-out infinite'
                  }}
                >
                  <i className={`bi ${currentConfig.icon}`} style={{ fontSize: '1.8rem' }}></i>
                </div>
              </div>
              <p className="mb-0 text-dark fw-normal" style={{ fontSize: '1rem', lineHeight: '1.5' }}>
                {message}
              </p>
            </div>

            {/* Footer con botones modernos */}
            <div className="modal-footer border-0 bg-light p-3 d-flex gap-2 justify-content-center">
              <button
                type="button"
                className="btn btn-light px-3 py-2 shadow-sm border"
                onClick={onHide}
                style={{
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  minWidth: '110px',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                }}
              >
                <i className="bi bi-x-circle me-2"></i>
                {cancelText}
              </button>
              <button
                type="button"
                className={`btn ${currentConfig.btnClass} px-3 py-2 shadow-sm`}
                onClick={handleConfirm}
                style={{
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  minWidth: '110px',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                }}
              >
                <i className="bi bi-check-circle me-2"></i>
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de animación en línea */}
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes iconPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }


        .btn:active {
          transform: scale(0.98) !important;
        }
      `}</style>
    </>
  );
};

export default ConfirmModal;
