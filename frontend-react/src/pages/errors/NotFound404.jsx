import { useNavigate, Link } from 'react-router-dom';

export default function NotFound404() {
  const navigate = useNavigate();

  const volver = () => {
    navigate(-1);
  };

  return (
    <div
      className="container-fluid min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 9999
      }}
    >
      {/* Círculos decorativos de fondo con animación */}
      <div className="position-absolute w-100 h-100 top-0 start-0" style={{ pointerEvents: 'none', zIndex: 1 }}>
        <div
          className="position-absolute rounded-circle"
          style={{
            width: '400px',
            height: '400px',
            top: '5%',
            left: '5%',
            background: 'radial-gradient(circle, rgba(185,8,161,0.15) 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite'
          }}
        ></div>
        <div
          className="position-absolute rounded-circle"
          style={{
            width: '300px',
            height: '300px',
            bottom: '10%',
            right: '10%',
            background: 'radial-gradient(circle, rgba(185,8,161,0.2) 0%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse'
          }}
        ></div>
        <div
          className="position-absolute rounded-circle"
          style={{
            width: '250px',
            height: '250px',
            top: '50%',
            left: '80%',
            background: 'radial-gradient(circle, rgba(185,8,161,0.1) 0%, transparent 70%)',
            animation: 'float 12s ease-in-out infinite'
          }}
        ></div>
      </div>

      {/* Contenido principal */}
      <div className="text-center position-relative px-3" style={{ zIndex: 2, maxWidth: '700px' }}>
        {/* Icono animado */}
        <div className="mb-4" style={{ animation: 'bounce 2s ease-in-out infinite' }}>
          <i
            className="bi bi-exclamation-circle-fill"
            style={{
              fontSize: '7rem',
              color: '#B908A1',
              filter: 'drop-shadow(0 0 30px rgba(185,8,161,0.6))',
              textShadow: '0 0 20px rgba(185,8,161,0.8)'
            }}
          ></i>
        </div>

        {/* Código de error con efecto gradiente */}
        <h1
          className="display-1 fw-bold mb-4"
          style={{
            fontSize: '9rem',
            background: 'linear-gradient(135deg, #B908A1 0%, #D946C3 50%, #FF69EB 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 5px 30px rgba(185,8,161,0.5)',
            letterSpacing: '0.1em',
            animation: 'glow 2s ease-in-out infinite alternate'
          }}
        >
          404
        </h1>

        {/* Título */}
        <h2 className="h1 fw-bold mb-3 text-white">Página no encontrada</h2>

        {/* Mensaje */}
        <p className="lead mb-5 text-white-50" style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>

        {/* Botones de acción con diseño mejorado */}
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <Link
            to="/"
            className="btn btn-lg shadow-lg d-flex align-items-center gap-2 px-4 py-3"
            style={{
              background: 'linear-gradient(135deg, #B908A1, #9A0785)',
              border: 'none',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 20px rgba(185,8,161,0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(185,8,161,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(185,8,161,0.4)';
            }}
          >
            <i className="bi bi-house-door-fill"></i>
            Volver al inicio
          </Link>
          <button
            onClick={volver}
            className="btn btn-lg d-flex align-items-center gap-2 px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '2px solid rgba(185,8,161,0.5)',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '600',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(185,8,161,0.2)';
              e.currentTarget.style.borderColor = '#B908A1';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(185,8,161,0.5)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <i className="bi bi-arrow-left-circle-fill"></i>
            Volver atrás
          </button>
        </div>
      </div>

      {/* Animaciones CSS inline */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes glow {
          from { filter: drop-shadow(0 0 20px rgba(185,8,161,0.6)); }
          to { filter: drop-shadow(0 0 40px rgba(185,8,161,0.9)); }
        }
      `}</style>
    </div>
  );
}
