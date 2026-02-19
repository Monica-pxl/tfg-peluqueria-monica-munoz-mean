// middlewares/index.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const aplicarMiddlewares = (app) => {
    // Middlewares básicos
    app.use(morgan('dev'));
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    console.log('✅ Middlewares configurados correctamente');
};

module.exports = aplicarMiddlewares;