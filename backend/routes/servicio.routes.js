const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicio.controller');
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');

// CRUD de servicios
router.get('/', servicioController.getAllServicios);
router.post('/', auth, soloAdmin, servicioController.createServicio);
router.put('/:id', auth, soloAdmin, servicioController.updateServicio);
router.delete('/:id', auth, soloAdmin, servicioController.deleteServicio);

module.exports = router;
