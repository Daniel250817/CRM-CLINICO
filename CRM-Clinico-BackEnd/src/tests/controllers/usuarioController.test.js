const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

// Mock dependencies
jest.mock('../../models', () => ({
  Usuario: {
    findAll: jest.fn(),
    findByPk: jest.fn()
  },
  Cliente: {
    findOne: jest.fn()
  },
  Dentista: {
    findOne: jest.fn()
  },
  UserSettings: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('../../middlewares/auth', () => ({
  protegerRuta: (req, res, next) => {
    req.usuario = {
      id: 1,
      rol: 'admin',
      nombre: 'Admin User',
      email: 'admin@example.com',
      telefono: '1234567890',
      ultimoLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    next();
  },
  restringirA: () => (req, res, next) => next()
}));

describe('Usuario Controller', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return all users when authenticated as admin', async () => {
      // Mock users
      const mockUsers = [
        {
          id: 1,
          nombre: 'Admin User',
          email: 'admin@example.com',
          rol: 'admin',
          telefono: '1234567890'
        },
        {
          id: 2,
          nombre: 'Dentist User',
          email: 'dentist@example.com',
          rol: 'dentista',
          telefono: '0987654321'
        }
      ];
      
      // Mock Usuario.findAll
      db.Usuario.findAll.mockResolvedValue(mockUsers);
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer fake-jwt-token');
        
      // Assertions
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(db.Usuario.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/users/me', () => {
    it('should return the current user profile', async () => {
      const mockSettings = {
        id: 1,
        userId: 1,
        theme: 'light',
        language: 'es'
      };

      db.UserSettings.findOne.mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer fake-jwt-token');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('usuario');
      expect(response.body.data).toHaveProperty('settings', mockSettings);
      expect(db.UserSettings.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
    });
  });
});
