'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('clientes', 'ciudad', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('clientes', 'codigoPostal', {
      type: Sequelize.STRING(10),
      allowNull: true
    });

    await queryInterface.addColumn('clientes', 'estadoCivil', {
      type: Sequelize.ENUM('soltero', 'casado', 'divorciado', 'viudo'),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('clientes', 'ciudad');
    await queryInterface.removeColumn('clientes', 'codigoPostal');
    await queryInterface.removeColumn('clientes', 'estadoCivil');
  }
}; 