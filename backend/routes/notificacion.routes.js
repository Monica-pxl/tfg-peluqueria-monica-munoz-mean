const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacion.controller');

// CRUD de notificaciones
router.get('/', notificacionController.getAllNotificaciones);
router.post('/', notificacionController.createNotificacion);
router.delete('/:id', notificacionController.deleteNotificacion);

// Rutas especiales
router.get('/usuario/:id', notificacionController.getNotificacionesByUsuario);
router.get('/usuario/:id/no-leidas', notificacionController.getNotificacionesNoLeidas);
router.get('/usuario/:id/contar-no-leidas', notificacionController.contarNotificacionesNoLeidas);
router.put('/:id/marcar-leida', notificacionController.marcarComoLeida);
router.put('/usuario/:id/marcar-todas-leidas', notificacionController.marcarTodasComoLeidas);
router.delete('/usuario/:id', notificacionController.deleteNotificacionesByUsuario);

module.exports = router;
