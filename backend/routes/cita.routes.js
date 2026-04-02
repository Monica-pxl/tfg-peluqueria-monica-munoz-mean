const express = require('express');
const router = express.Router();
const citaController = require('../controllers/cita.controller');
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const soloActivo = require('../middlewares/soloActivo');

// CRUD de citas
router.get('/', auth, soloActivo, soloAdmin, citaController.getAllCitas);
router.get('/:id', auth, soloActivo, citaController.getCitaById);
router.post('/', auth, soloActivo, citaController.createCita);
router.put('/:id', auth, soloActivo, citaController.updateCita);
router.delete('/:id', auth, soloActivo, soloAdmin, citaController.deleteCita);

// Rutas especiales
router.get('/usuario/:usuarioId', auth, soloActivo, citaController.getCitasByUsuario);
router.get('/profesional/:profesionalId', auth, soloActivo, citaController.getCitasByProfesional);
router.put('/:id/marcar-realizada', auth, soloActivo, citaController.marcarRealizada);
router.get('/disponibilidad/:profesionalId/:fecha/:hora', citaController.verificarDisponibilidad);

module.exports = router;
