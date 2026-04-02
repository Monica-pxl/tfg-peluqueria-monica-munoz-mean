const express = require('express');
const router = express.Router();
const centroController = require('../controllers/centro.controller');
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const soloActivo = require('../middlewares/soloActivo');

// CRUD de centros
router.get('/', centroController.getAllCentros);
router.get('/:id', centroController.getCentroById);
router.post('/', auth, soloActivo, soloAdmin, centroController.createCentro);
router.put('/:id', auth, soloActivo, soloAdmin, centroController.updateCentro);
router.delete('/:id', auth, soloActivo, soloAdmin, centroController.deleteCentro);

module.exports = router;
