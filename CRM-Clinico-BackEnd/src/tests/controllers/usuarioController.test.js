const request = require('supertest');
const app = require('../server'); // Adjust path if needed
const { Usuario } = require('../models/Usuario');
const { verifyToken } = require('../utils/jwt');

// Mock dependencies
jest.mock('../models/Usuario');
jest.mock('../utils/jwt');
jest.mock('../middlewares/auth', () => ({
  verificarToken: (req, res, next) => next(),
  verificarRol: (roles) => (req, res, next) => {
    req.usuario = { id: 1, rol: 'admin' };
    next();
  }
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
      Usuario.findAll.mockResolvedValue(mockUsers);
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer fake-jwt-token');
        
      // Assertions
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(Usuario.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/users/me', () => {
    it('should return the current user profile', async () => {
      // Mock user
      const mockUser = {
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com',
        rol: 'cliente',
        telefono: '1234567890'
      };
      
      // Set up request with mocked auth middleware
      const mockedMiddleware = (req, res, next) => {
        req.usuario = { id: 1 };
        next();
      };
      
      // Mock Usuario.findByPk
      Usuario.findByPk.mockResolvedValue(mockUser);
      
      // Replace the middleware temporarily
      const originalMiddleware = app._router.stack.find(layer => layer.name === 'verificarToken');
      const originalIndex = app._router.stack.indexOf(originalMiddleware);
      if (originalIndex !== -1) {
        app._router.stack[originalIndex] = { ...originalMiddleware, handle: mockedMiddleware };
      }
      
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer fake-jwt-token');
        
      // Reset middleware
      if (originalIndex !== -1) {
        app._router.stack[originalIndex] = originalMiddleware;
      }
        
      // Assertions
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(Usuario.findByPk).toHaveBeenCalledWith(1, { 
        attributes: { exclude: ['password'] } 
      });
    });

    it('should return 404 if user not found', async () => {
      // Set up request with mocked auth middleware
      const mockedMiddleware = (req, res, next) => {
        req.usuario = { id: 999 }; // Non-existent ID
        next();
      };
      
      // Mock Usuario.findByPk to return null (user not found)
      Usuario.findByPk.mockResolvedValue(null);
      
      // Replace the middleware temporarily
      const originalMiddleware = app._router.stack.find(layer => layer.name === 'verificarToken');
      const originalIndex = app._router.stack.indexOf(originalMiddleware);
      if (originalIndex !== -1) {
        app._router.stack[originalIndex] = { ...originalMiddleware, handle: mockedMiddleware };
      }
      
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer fake-jwt-token');
        
      // Reset middleware
      if (originalIndex !== -1) {
        app._router.stack[originalIndex] = originalMiddleware;
      }
        
      // Assertions
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('message', 'Usuario no encontrado');
    });
  });
});
