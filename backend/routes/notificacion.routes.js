const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacion.controller');
const auth = require('../middlewares/auth');

// CRUD de notificaciones
router.post('/', notificacionController.createNotificacion);
router.delete('/:id', notificacionController.deleteNotificacion);

// Rutas especiales
router.get('/usuario/:id', auth, notificacionController.getNotificacionesByUsuario);
router.get('/usuario/:id/no-leidas', auth, notificacionController.getNotificacionesNoLeidas);
router.get('/usuario/:id/contar-no-leidas', auth, notificacionController.contarNotificacionesNoLeidas);
router.put('/:id/marcar-leida', auth, notificacionController.marcarComoLeida);
router.put('/usuario/:id/marcar-todas-leidas', auth, notificacionController.marcarTodasComoLeidas);
router.delete('/usuario/:id', auth, notificacionController.deleteNotificacionesByUsuario);

module.exports = router;
