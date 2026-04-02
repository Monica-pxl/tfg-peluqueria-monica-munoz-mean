const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horario.controller');
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const soloActivo = require('../middlewares/soloActivo');

// CRUD de horarios
router.get('/', horarioController.getAllHorarios);
router.get('/:id', horarioController.getHorarioById);
router.post('/', auth, soloActivo, soloAdmin, horarioController.createHorario);
router.put('/:id', auth, soloActivo, soloAdmin, horarioController.updateHorario);
router.delete('/:id', auth, soloActivo, soloAdmin, horarioController.deleteHorario);

module.exports = router;
