const express = require('express');
const router = express.Router();
const profesionalController = require('../controllers/profesional.controller');
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const soloActivo = require('../middlewares/soloActivo');

// CRUD de profesionales
router.get('/', profesionalController.getAllProfesionales);
router.get('/:id', profesionalController.getProfesionalById);
router.post('/', auth, soloActivo, soloAdmin, profesionalController.createProfesional);
router.put('/:id', auth, soloActivo, soloAdmin, profesionalController.updateProfesional);
router.delete('/:id', auth, soloActivo, soloAdmin, profesionalController.deleteProfesional);

module.exports = router;
