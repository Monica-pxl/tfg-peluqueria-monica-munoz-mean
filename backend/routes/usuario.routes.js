const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');

// Endpoints de usuarios
router.get('/', usuarioController.getAllUsuarios);
router.put('/:id', usuarioController.updateUsuario);
router.delete('/:id', usuarioController.deleteUsuario);

module.exports = router;
