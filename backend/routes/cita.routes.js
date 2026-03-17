const express = require('express');
const router = express.Router();
const citaController = require('../controllers/cita.controller');
const auth = require('../middlewares/auth');

// CRUD de citas
router.get('/', citaController.getAllCitas);
router.get('/:id', auth, citaController.getCitaById);
router.post('/', citaController.createCita);
router.put('/:id', auth, citaController.updateCita);
router.delete('/:id', auth, citaController.deleteCita);

// Rutas especiales
router.get('/usuario/:usuarioId', auth, citaController.getCitasByUsuario);
router.get('/profesional/:profesionalId', auth, citaController.getCitasByProfesional);
router.put('/:id/marcar-realizada', auth, citaController.marcarRealizada);
router.get('/disponibilidad/:profesionalId/:fecha/:hora', citaController.verificarDisponibilidad);

module.exports = router;
