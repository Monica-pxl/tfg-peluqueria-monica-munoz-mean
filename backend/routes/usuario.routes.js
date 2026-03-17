const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');

// Endpoints de usuarios
router.get('/', auth, soloAdmin, usuarioController.getAllUsuarios);
router.put('/:id', auth, usuarioController.updateUsuario);
router.delete('/:id', auth, usuarioController.deleteUsuario);

module.exports = router;
