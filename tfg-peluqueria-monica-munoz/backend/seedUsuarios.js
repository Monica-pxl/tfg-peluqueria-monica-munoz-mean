const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Usuario = require('./models/Usuario');

const uri = "mongodb+srv://admin:JLL89255!@peluqueriacluster.qpusqz6.mongodb.net/tfg_peluqueria?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    const usuariosData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'usuarios.json'), 'utf8'));

    // Limpiar colección
    await Usuario.deleteMany({});

    // Preparar usuarios
    const usuariosPreparados = usuariosData.map(u => {
      // Crear objeto final
      const usuarioMongo = {
        nombre: u.nombre,
        email: u.email,
        password: u.password, // Ya está hasheada en el JSON
        rol: u.rol,
        estado: u.estado || 'activo',
        fecha_alta: u.fecha_alta || new Date(),
      };

      // Solo los clientes tienen puntos
      if (u.rol === 'cliente') {
        usuarioMongo.puntos = u.puntos || 0;
      }

      return usuarioMongo;
    });

    await Usuario.insertMany(usuariosPreparados);

    console.log("📦 Usuarios insertados en MongoDB Atlas");
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
