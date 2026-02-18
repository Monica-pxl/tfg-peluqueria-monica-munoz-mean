const express = require('express');
const router = express.Router();
const profesionalServicioController = require('../controllers/profesionalServicio.controller');

// CRUD de relaciones profesional-servicio
router.get('/', profesionalServicioController.getAllRelaciones);
router.post('/', profesionalServicioController.createRelacion);
router.delete('/:id', profesionalServicioController.deleteRelacion);
router.delete('/servicio/:id', profesionalServicioController.deleteRelacionesByServicio);
router.delete('/profesional/:id', profesionalServicioController.deleteRelacionesByProfesional);

module.exports = router;
