const express = require('express');
const router = express.Router();
const profesionalServicioController = require('../controllers/profesionalServicio.controller');
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const soloActivo = require('../middlewares/soloActivo');

// CRUD de relaciones profesional-servicio
router.get('/', profesionalServicioController.getAllRelaciones);
router.post('/', auth, soloActivo, soloAdmin, profesionalServicioController.createRelacion);
// Las rutas más específicas deben ir primero
router.delete('/servicio/:servicioId', auth, soloActivo, soloAdmin, profesionalServicioController.deleteRelacionesByServicio);
router.delete('/profesional/:profesionalId', auth, soloActivo, soloAdmin, profesionalServicioController.deleteRelacionesByProfesional);
router.delete('/:id', auth, soloActivo, soloAdmin, profesionalServicioController.deleteRelacion);

module.exports = router;
