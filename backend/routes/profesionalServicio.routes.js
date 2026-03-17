const express = require('express');
const router = express.Router();
const profesionalServicioController = require('../controllers/profesionalServicio.controller');
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');

// CRUD de relaciones profesional-servicio
router.get('/', profesionalServicioController.getAllRelaciones);
router.post('/', auth, soloAdmin, profesionalServicioController.createRelacion);
// Las rutas más específicas deben ir primero
router.delete('/servicio/:servicioId', auth, soloAdmin, profesionalServicioController.deleteRelacionesByServicio);
router.delete('/profesional/:profesionalId', auth, soloAdmin, profesionalServicioController.deleteRelacionesByProfesional);
router.delete('/:id', auth, soloAdmin, profesionalServicioController.deleteRelacion);

module.exports = router;
