const express = require('express');
const router = express.Router();
const profesionalController = require('../controllers/profesional.controller');
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');

// CRUD de profesionales
router.get('/', profesionalController.getAllProfesionales);
router.get('/:id', profesionalController.getProfesionalById);
router.post('/', auth, soloAdmin, profesionalController.createProfesional);
router.put('/:id', auth, soloAdmin, profesionalController.updateProfesional);
router.delete('/:id', auth, soloAdmin, profesionalController.deleteProfesional);

module.exports = router;
