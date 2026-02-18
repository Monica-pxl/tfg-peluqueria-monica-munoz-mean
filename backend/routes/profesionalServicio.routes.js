const express = require('express');
const router = express.Router();
const profesionalServicioController = require('../controllers/profesionalServicio.controller');

// CRUD de relaciones profesional-servicio
router.get('/', profesionalServicioController.getAllRelaciones);
router.post('/', profesionalServicioController.createRelacion);
// Las rutas más específicas deben ir primero
router.delete('/servicio/:servicioId', profesionalServicioController.deleteRelacionesByServicio);
router.delete('/profesional/:profesionalId', profesionalServicioController.deleteRelacionesByProfesional);
router.delete('/:id', profesionalServicioController.deleteRelacion);

module.exports = router;
