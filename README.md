# HairGest — Sistema de Gestión para Peluquerías Multicentro

## 1. Descripción del proyecto
**HairGest** es una aplicación web desarrollada como Trabajo de Fin de Grado con el objetivo de centralizar la gestión de citas de peluquerías con múltiples centros de estética y peluquerías. El sistema permite administrar centros, profesionales, horarios, servicios y usuarios desde una única plataforma, garantizando la consistencia de la disponibilidad horaria y una interfaz diferenciada según el perfil del usuario.

**Objetivo general:** Desarrollar una solución web que facilite la digitalización de la gestión de reservas en negocios de estética, incorporando un sistema de fidelización por puntos y notificaciones automáticas.

---

## 2. Tecnologías utilizadas

### Backend
*   **Entorno de ejecución:** Node.js (v18.x o superior)
*   **Framework:** Express.js (v5.x)
*   **Base de datos:** MongoDB Atlas (NoSQL)
*   **ODM:** Mongoose (v9.x)
*   **Seguridad:** Autenticación mediante tokens JWT y cifrado de contraseñas con bcryptjs.

### Frontend
*   **Framework:** Angular (v20.x)
*   **Estilos:** Bootstrap (v5.x) para maquetación adaptativa.

### Herramientas
*   **Control de versiones:** Git y GitHub.
*   **Pruebas de API:** Postman.
*   **Diseño y modelado:** Draw.io (diagrama ER) y Visual Studio Code / IntelliJ IDEA.
*   **Despliegue:** Vercel.

---

## 3. Estructura del proyecto
```text
/
├── api/                           # Adaptador serverless para el despliegue en Vercel.
├── backend/                       # API REST: rutas, controladores, helpers, modelos y middlewares.
├── frontend-react/                # Prototipo previo desarrollado con React y Vite. Desplegado durante fases iniciales del desarrollo y actualmente no utilizado en la versión final del sistema.
└── tfg-peluqueria-monica-munoz/   # Aplicación frontend final desarrollada con Angular.
```

---

## 4. Instalación

### 4.1 Clonar el repositorio
```bash
git clone https://github.com/Monica-pxl/tfg-peluqueria-monica-munoz-mean.git
```

### 4.2 Backend
```bash
cd backend
npm install
node server.js
```

### 4.3 Frontend
```bash
cd tfg-peluqueria-monica-munoz
npm install
ng serve
```

---

## 5. Variables de entorno
Es necesario crear un archivo `.env` en el directorio `/backend` con los siguientes parámetros:
*   `PORT`: Puerto en el que se ejecutará el servidor.
*   `MONGODB_URI`: Cadena de conexión a la instancia de MongoDB Atlas.
*   `JWT_SECRET`: Clave secreta utilizada para la firma y verificación de tokens JWT.

---

## 6. Roles del sistema
*   **Cliente:** Puede realizar reservas, gestionar sus citas pendientes y acumular puntos de fidelización (niveles: Nuevo, Frecuente, Habitual y Premium).
*   **Profesional:** Puede confirmar, cancelar, marcar como realizadas citas y consultar sus horarios asignados.
*   **Administrador:** Dispone de control total sobre centros, servicios, profesionales, usuarios y horarios, además de acceso a las estadísticas globales del sistema.

---

## 7. Decisiones técnicas
*   **Arquitectura:** El sistema sigue el modelo cliente-servidor con una API REST desacoplada del frontend.
*   **Integridad de datos:** Las citas almacenan datos históricos (nombre del servicio, precio, nombre del profesional, etc.) para preservar la información aunque los registros originales sean eliminados posteriormente.
*   **Reglas de negocio:** El sistema valida la disponibilidad en tiempo real e impide la creación de citas con solapamiento horario.

---

## 8. Estado del proyecto
*   **Backend:** Completado. API REST funcional con autenticación JWT.
*   **Frontend:** Completado. Aplicación SPA adaptativa desarrollada con Angular.
*   **Base de datos:** Operativa en la nube mediante MongoDB Atlas.
*   **Funcionalidades principales:** Gestión multicentro, sistema de puntos y notificaciones automáticas.

---

## 9. Autor
*   **Autora:** Mónica Muñoz de la Torre
*   **Tutor:** Jesús Clemente Gallart
*   **Centro:** DIGITECH — CFGS Desarrollo de Aplicaciones Web
*   **Curso:** 2025–2026