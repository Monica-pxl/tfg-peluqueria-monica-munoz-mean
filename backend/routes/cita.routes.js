const express = require('express');
const router = express.Router();
const citaController = require('../controllers/cita.controller');

// CRUD de citas
router.get('/', citaController.getAllCitas);
router.get('/:id', citaController.getCitaById);
router.post('/', citaController.createCita);
router.put('/:id', citaController.updateCita);
router.delete('/:id', citaController.deleteCita);

// Rutas especiales
router.get('/usuario/:usuarioId', citaController.getCitasByUsuario);
router.get('/profesional/:profesionalId', citaController.getCitasByProfesional);
router.put('/:id/marcar-realizada', citaController.marcarRealizada);
router.get('/disponibilidad/:profesionalId/:fecha/:hora', citaController.verificarDisponibilidad);

module.exports = router;
