require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('./models/usuario');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('❌ Falta MONGO_URI en .env');

// Leer datos originales
const usuariosOriginales = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data_originales/usuariosOriginal.json'), 'utf8')
);

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Conectado a MongoDB Atlas");

    await Usuario.deleteMany({});
    console.log("🧹 Colección usuarios limpiada");

    // Ordenar por id_usuario para mantener el orden original
    usuariosOriginales.sort((a, b) => a.id_usuario - b.id_usuario);

    // Mapeo de id_usuario original → _id de MongoDB
    const usuarioMap = {};

    for (const u of usuariosOriginales) {
      const usuarioData = {
        nombre: u.nombre,
        email: u.email,
        password: u.password,
        rol: u.rol,
        estado: u.estado || 'activo',
        fecha_alta: u.fecha_alta || new Date()
      };

      // Solo los clientes tienen puntos
      if (u.rol === 'cliente') {
        usuarioData.puntos = u.puntos || 0;
      }

      const usuario = await Usuario.create(usuarioData);
      usuarioMap[u.id_usuario] = usuario._id.toString();
    }

    // Guardar mapeo para otros seeds
    fs.writeFileSync(
      path.join(__dirname, 'mapeo_usuarios.json'),
      JSON.stringify(usuarioMap, null, 2)
    );

    console.log(`📦 ${usuariosOriginales.length} Usuarios insertados en MongoDB Atlas`);
    console.log("💾 Mapeo guardado en mapeo_usuarios.json");

    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  });
