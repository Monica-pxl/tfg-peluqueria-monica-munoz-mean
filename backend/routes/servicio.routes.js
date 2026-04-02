const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicio.controller');
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const soloActivo = require('../middlewares/soloActivo');

// CRUD de servicios
router.get('/', servicioController.getAllServicios);
router.post('/', auth, soloActivo, soloAdmin, servicioController.createServicio);
router.put('/:id', auth, soloActivo, soloAdmin, servicioController.updateServicio);
router.delete('/:id', auth, soloActivo, soloAdmin, servicioController.deleteServicio);

module.exports = router;
