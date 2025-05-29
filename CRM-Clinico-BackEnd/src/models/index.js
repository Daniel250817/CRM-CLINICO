const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const { config, sequelize: dbSequelize } = require('../config/database');
const db = {};

let sequelize = dbSequelize;

// Cargar todos los modelos automáticamente
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    // Si el modelo es una función, ejecutarla con sequelize
    if (typeof model === 'function') {
      const modelInstance = model(sequelize);
      db[modelInstance.name] = modelInstance;
    } else {
      // Si ya es una instancia del modelo (como Factura.js)
      db[model.name] = model;
    }
  });

// Establecer las asociaciones entre modelos
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
