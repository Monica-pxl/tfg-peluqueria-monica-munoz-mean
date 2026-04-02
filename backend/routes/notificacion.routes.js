const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacion.controller');
const auth = require('../middlewares/auth');
const soloActivo = require('../middlewares/soloActivo');

// CRUD de notificaciones
router.post('/', notificacionController.createNotificacion);
router.delete('/:id', auth, soloActivo, notificacionController.deleteNotificacion);

// Rutas especiales
router.get('/usuario/:id', auth, soloActivo, notificacionController.getNotificacionesByUsuario);
router.get('/usuario/:id/no-leidas', auth, soloActivo, notificacionController.getNotificacionesNoLeidas);
router.get('/usuario/:id/contar-no-leidas', auth, soloActivo, notificacionController.contarNotificacionesNoLeidas);
router.put('/:id/marcar-leida', auth, soloActivo, notificacionController.marcarComoLeida);
router.put('/usuario/:id/marcar-todas-leidas', auth, soloActivo, notificacionController.marcarTodasComoLeidas);
router.delete('/usuario/:id', auth, soloActivo, notificacionController.deleteNotificacionesByUsuario);

module.exports = router;
