'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('clientes');
    
    await queryInterface.createTable('clientes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      historialMedico: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      alergias: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fechaRegistro: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      fechaNacimiento: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      genero: {
        type: Sequelize.ENUM('masculino', 'femenino', 'otro', 'prefiero no decir'),
        allowNull: true
      },
      direccion: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      ocupacion: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      contactoEmergencia: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      telefonoEmergencia: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      ultimaVisita: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notas: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Agregar índices
    await queryInterface.addIndex('clientes', ['userId']);
    await queryInterface.addIndex('clientes', ['fechaRegistro']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('clientes');
  }
}; 