const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horario.controller');
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');

// CRUD de horarios
router.get('/', horarioController.getAllHorarios);
router.get('/:id', horarioController.getHorarioById);
router.post('/', auth, soloAdmin, horarioController.createHorario);
router.put('/:id', auth, soloAdmin, horarioController.updateHorario);
router.delete('/:id', auth, soloAdmin, horarioController.deleteHorario);

module.exports = router;
