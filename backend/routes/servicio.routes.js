const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicio.controller');

// CRUD de servicios
router.get('/', servicioController.getAllServicios);
router.post('/', servicioController.createServicio);
router.put('/:id', servicioController.updateServicio);
router.delete('/:id', servicioController.deleteServicio);

module.exports = router;
