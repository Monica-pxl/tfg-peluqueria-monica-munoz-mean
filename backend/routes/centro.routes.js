const express = require('express');
const router = express.Router();
const centroController = require('../controllers/centro.controller');

// CRUD de centros
router.get('/', centroController.getAllCentros);
router.get('/:id', centroController.getCentroById);
router.post('/', centroController.createCentro);
router.put('/:id', centroController.updateCentro);
router.delete('/:id', centroController.deleteCentro);

module.exports = router;
