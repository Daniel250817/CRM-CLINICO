'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('usuarios', 'estado', {
      type: Sequelize.ENUM('activo', 'inactivo'),
      defaultValue: 'activo',
      allowNull: false
    });

    // Actualizar todos los registros existentes a 'activo'
    await queryInterface.sequelize.query(
      `UPDATE usuarios SET estado = 'activo' WHERE estado IS NULL`
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('usuarios', 'estado');
  }
}; 