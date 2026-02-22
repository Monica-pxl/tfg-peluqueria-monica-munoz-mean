// Punto de entrada para Vercel Serverless Function
// Las variables de entorno se cargan automáticamente desde Vercel Dashboard

// Si estamos en desarrollo local, cargar .env desde backend
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '../backend/.env' });
}

// Exportar la aplicación Express
module.exports = require('../backend/server.js');
