// helpers/notificaciones.helper.js
const Notificacion = require('../models/notificacion');
const Usuario = require('../models/usuario');

// Función helper para crear notificación
async function crearNotificacion(usuario, rolDestino, titulo, mensaje, tipo = 'info') {
    // Si no hay usuario, no podemos crear la notificación
    if (!usuario) {
        console.warn(`⚠️ crearNotificacion: usuario es null/undefined, se omite notificación "${titulo}"`);
        return null;
    }
    try {
        const notificacion = new Notificacion({
            usuario,
            rolDestino,
            titulo,
            mensaje,
            tipo,
            leida: false
        });
        await notificacion.save();
        console.log(`✅ Notificación creada para usuario ${usuario}: ${titulo}`);
        return notificacion;
    } catch (error) {
        // Las notificaciones son secundarias; un fallo no debe interrumpir la operación principal
        console.error('❌ Error al crear notificación (no crítico):', error.message);
        return null;
    }
}

// Función para obtener todos los administradores
async function obtenerAdministradores() {
    try {
        const admins = await Usuario.find({ rol: 'administrador', estado: 'activo' });
        return admins.map(admin => admin._id);
    } catch (error) {
        console.error('Error al obtener administradores:', error);
        return [];
    }
}

// Función para obtener nivel de fidelidad según puntos
function getNivelFidelidad(puntos) {
    if (puntos >= 100) return { nivel: 'premium', nombre: 'Cliente Premium' };
    if (puntos >= 50) return { nivel: 'habitual', nombre: 'Cliente Habitual' };
    if (puntos >= 20) return { nivel: 'frecuente', nombre: 'Cliente Frecuente' };
    return { nivel: 'nuevo', nombre: 'Cliente Nuevo' };
}

// Función para formatear fecha
function formatearFecha(fecha) {
    const d = new Date(fecha);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

module.exports = {
    crearNotificacion,
    obtenerAdministradores,
    getNivelFidelidad,
    formatearFecha
};