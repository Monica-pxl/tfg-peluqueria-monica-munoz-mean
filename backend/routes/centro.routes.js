const express = require('express');
const router = express.Router();
const centroController = require('../controllers/centro.controller');
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');

// CRUD de centros
router.get('/', centroController.getAllCentros);
router.get('/:id', centroController.getCentroById);
router.post('/', auth, soloAdmin, centroController.createCentro);
router.put('/:id', auth, soloAdmin, centroController.updateCentro);
router.delete('/:id', auth, soloAdmin, centroController.deleteCentro);

module.exports = router;
