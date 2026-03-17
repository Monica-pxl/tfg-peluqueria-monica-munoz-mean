const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const auth = require('../middlewares/auth');

// Endpoints de usuarios
router.get('/', usuarioController.getAllUsuarios);
router.put('/:id', auth, usuarioController.updateUsuario);
router.delete('/:id', auth, usuarioController.deleteUsuario);

module.exports = router;
