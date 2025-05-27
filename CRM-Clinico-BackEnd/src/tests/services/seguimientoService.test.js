const SeguimientoService = require('../../services/seguimientoService');
const { Cliente, Usuario, Cita, Servicio } = require('../../models');
const { sequelize } = require('../../config/database');

// Mocking dependencies
jest.mock('../../models');
jest.mock('../../config/database', () => ({
  sequelize: {
    query: jest.fn(),
    literal: jest.fn()
  }
}));

describe('SeguimientoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('obtenerPacientesRecurrentes', () => {
    it('should return recurring patients with more than minVisitas', async () => {
      // Mock Cita.findAll response
      const mockCitas = [
        {
          cliente_id: 1,
          dataValues: { totalVisitas: 5 },
          Cliente: {
            id: 1,
            historial_medico: 'Historial médico del paciente',
            alergias: 'Penicilina',
            fecha_registro: '2023-05-15',
            Usuario: {
              nombre: 'Juan Pérez',
              email: 'juan@example.com',
              telefono: '1234567890'
            }
          }
        },
        {
          cliente_id: 2,
          dataValues: { totalVisitas: 4 },
          Cliente: {
            id: 2,
            historial_medico: 'Otro historial médico',
            alergias: 'Ninguna',
            fecha_registro: '2023-06-20',
            Usuario: {
              nombre: 'Ana Rodríguez',
              email: 'ana@example.com',
              telefono: '0987654321'
            }
          }
        }
      ];

      Cita.findAll.mockResolvedValue(mockCitas);

      // Call the function
      const result = await SeguimientoService.obtenerPacientesRecurrentes(3);

      // Assertions
      expect(Cita.findAll).toHaveBeenCalledWith({
        attributes: expect.arrayContaining([
          'cliente_id',
          expect.any(Array)
        ]),
        group: ['cliente_id'],
        having: expect.anything(),
        include: expect.anything(),
        order: expect.anything()
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].nombre).toBe('Juan Pérez');
      expect(result[0].total_visitas).toBe(5);
      expect(result[1].id).toBe(2);
      expect(result[1].nombre).toBe('Ana Rodríguez');
    });

    it('should handle errors correctly', async () => {
      // Mock Cita.findAll to throw an error
      const errorMsg = 'Database error';
      Cita.findAll.mockRejectedValue(new Error(errorMsg));

      // Call the function and expect it to throw
      await expect(SeguimientoService.obtenerPacientesRecurrentes(3))
        .rejects
        .toThrow(errorMsg);
    });
  });

  describe('obtenerPacientesInactivos', () => {
    it('should return inactive patients with no visits in the specified days', async () => {
      // Mock subconsulta
      const mockUltimasVisitas = [
        {
          cliente_id: 1,
          ultima_visita: new Date('2023-01-01')
        },
        {
          cliente_id: 2,
          ultima_visita: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // 100 days ago
        }
      ];

      Cita.findAll.mockResolvedValue(mockUltimasVisitas);

      // Mock Cliente.findByPk
      const mockCliente1 = {
        id: 1,
        historial_medico: 'Historial paciente inactivo',
        fecha_registro: '2022-10-10',
        Usuario: {
          nombre: 'Cliente Inactivo',
          email: 'inactivo@example.com',
          telefono: '5555555555'
        }
      };

      const mockCliente2 = {
        id: 2,
        historial_medico: 'Otro historial',
        fecha_registro: '2022-11-15',
        Usuario: {
          nombre: 'Otro Cliente Inactivo',
          email: 'otro@example.com',
          telefono: '6666666666'
        }
      };

      // Mock sequential calls to Cliente.findByPk
      Cliente.findByPk
        .mockResolvedValueOnce(mockCliente1)
        .mockResolvedValueOnce(mockCliente2);

      // Call the function with 90 days
      const result = await SeguimientoService.obtenerPacientesInactivos(90);

      // Assertions
      expect(Cita.findAll).toHaveBeenCalledWith({
        attributes: expect.arrayContaining([
          'cliente_id',
          expect.any(Array)
        ]),
        group: ['cliente_id'],
        raw: true
      });

      expect(Cliente.findByPk).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].nombre).toBe('Cliente Inactivo');
      expect(result[0].ultima_visita).toBe(mockUltimasVisitas[0].ultima_visita);
      expect(result[0]).toHaveProperty('dias_sin_visita');
    });
  });

  describe('analizarPatronVisitas', () => {
    it('should return detailed visit pattern analysis', async () => {
      // Mock Cliente.findByPk
      const mockCliente = {
        id: 1,
        Usuario: {
          nombre: 'Cliente Test',
          email: 'test@example.com',
          telefono: '1234567890'
        }
      };

      Cliente.findByPk.mockResolvedValue(mockCliente);

      // Mock Cita.findAll
      const now = new Date();
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setMonth(now.getMonth() - 2);
      
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);

      const mockCitas = [
        {
          id: 1,
          fecha_hora: twoMonthsAgo,
          estado: 'completada',
          Servicio: {
            id: 1,
            nombre: 'Limpieza dental',
            precio: 800
          }
        },
        {
          id: 2,
          fecha_hora: oneMonthAgo,
          estado: 'completada',
          Servicio: {
            id: 1,
            nombre: 'Limpieza dental',
            precio: 800
          }
        },
        {
          id: 3,
          fecha_hora: now,
          estado: 'completada',
          Servicio: {
            id: 2,
            nombre: 'Revisión',
            precio: 500
          }
        }
      ];

      Cita.findAll.mockResolvedValue(mockCitas);

      // Call the function
      const result = await SeguimientoService.analizarPatronVisitas(1);

      // Assertions
      expect(Cliente.findByPk).toHaveBeenCalledWith(1, expect.anything());
      expect(Cita.findAll).toHaveBeenCalledWith({
        where: { cliente_id: 1 },
        include: expect.anything(),
        order: expect.anything()
      });

      expect(result).toHaveProperty('cliente');
      expect(result).toHaveProperty('analisis');
      expect(result).toHaveProperty('detalles');
      expect(result.analisis).toHaveProperty('total_visitas', 3);
      expect(result.analisis).toHaveProperty('primera_visita', twoMonthsAgo);
      expect(result.analisis).toHaveProperty('ultima_visita', now);
      expect(result.analisis).toHaveProperty('promedio_intervalo_dias');
      expect(result.analisis).toHaveProperty('servicios_frecuentes');
    });

    it('should handle insufficient visits', async () => {
      // Mock Cliente.findByPk
      const mockCliente = {
        id: 1,
        Usuario: {
          nombre: 'Cliente Nuevo',
          email: 'nuevo@example.com',
          telefono: '9999999999'
        }
      };

      Cliente.findByPk.mockResolvedValue(mockCliente);

      // Mock Cita.findAll - only one visit
      const now = new Date();
      const mockCitas = [
        {
          id: 1,
          fecha_hora: now,
          estado: 'completada',
          Servicio: {
            id: 1,
            nombre: 'Limpieza dental',
            precio: 800
          }
        }
      ];

      Cita.findAll.mockResolvedValue(mockCitas);

      // Call the function
      const result = await SeguimientoService.analizarPatronVisitas(1);

      // Assertions
      expect(result.analisis).toHaveProperty('mensaje', 'No hay suficientes visitas para analizar patrones');
      expect(result.analisis).toHaveProperty('total_visitas', 1);
    });
  });

  describe('generarRecomendaciones', () => {
    it('should generate personalized recommendations based on visit history', async () => {
      // Mock analizarPatronVisitas to return a standard analysis
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      
      const mockAnalisis = {
        cliente: {
          id: 1,
          nombre: 'Cliente Test',
          email: 'test@example.com',
          telefono: '1234567890'
        },
        analisis: {
          total_visitas: 5,
          primera_visita: new Date('2023-01-15'),
          ultima_visita: oneMonthAgo,
          promedio_intervalo_dias: 30,
          servicios_frecuentes: [
            {
              id: 1,
              nombre: 'Limpieza dental',
              contador: 3
            }
          ],
          dias_preferidos: ['Lunes'],
          horas_preferidas: [10, 11],
          proxima_visita_estimada: new Date(now)
        }
      };

      // Spy on analizarPatronVisitas and mock its implementation
      jest.spyOn(SeguimientoService, 'analizarPatronVisitas')
          .mockResolvedValue(mockAnalisis);

      // Call the function
      const result = await SeguimientoService.generarRecomendaciones(1);

      // Assertions
      expect(SeguimientoService.analizarPatronVisitas).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('recomendaciones');
      expect(result).toHaveProperty('acciones');
      expect(result.recomendaciones.length).toBeGreaterThan(0);
      expect(result.acciones.length).toBeGreaterThan(0);
      expect(result).toHaveProperty('clienteId', 1);
      expect(result).toHaveProperty('cliente');
      expect(result).toHaveProperty('proxima_visita_estimada');
    });

    it('should handle clients with insufficient visits', async () => {
      // Mock analizarPatronVisitas to return insufficient visits
      const mockAnalisis = {
        cliente: {
          id: 1,
          nombre: 'Cliente Nuevo',
          email: 'nuevo@example.com',
          telefono: '9999999999'
        },
        analisis: {
          total_visitas: 1,
          mensaje: 'No hay suficientes visitas para analizar patrones'
        }
      };

      jest.spyOn(SeguimientoService, 'analizarPatronVisitas')
          .mockResolvedValue(mockAnalisis);

      // Call the function
      const result = await SeguimientoService.generarRecomendaciones(1);

      // Assertions
      expect(result).toHaveProperty('recomendaciones');
      expect(result.recomendaciones).toContain('Registrar suficientes visitas para generar recomendaciones personalizadas');
    });
  });
});
