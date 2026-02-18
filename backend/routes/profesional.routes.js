const express = require('express');
const router = express.Router();
const profesionalController = require('../controllers/profesional.controller');

// CRUD de profesionales
router.get('/', profesionalController.getAllProfesionales);
router.get('/:id', profesionalController.getProfesionalById);
router.post('/', profesionalController.createProfesional);
router.put('/:id', profesionalController.updateProfesional);
router.delete('/:id', profesionalController.deleteProfesional);

module.exports = router;
