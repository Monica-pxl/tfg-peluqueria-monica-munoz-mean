const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');
const soloActivo = require('../middlewares/soloActivo');

// Endpoints de usuarios
router.get('/', auth, soloActivo, soloAdmin, usuarioController.getAllUsuarios);
router.put('/:id', auth, soloActivo, soloAdmin, usuarioController.updateUsuario);
router.delete('/:id', auth, soloActivo, soloAdmin, usuarioController.deleteUsuario);

module.exports = router;
