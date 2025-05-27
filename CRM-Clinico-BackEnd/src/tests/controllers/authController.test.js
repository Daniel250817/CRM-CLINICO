const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../server'); // Adjust path if needed
const { Usuario } = require('../models/Usuario');
const { generarToken } = require('../utils/jwt');

// Mock dependencies
jest.mock('../models/Usuario');
jest.mock('../utils/jwt');
jest.mock('bcryptjs');

describe('Auth Controller', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock bcrypt hash
      bcrypt.hash.mockResolvedValue('hashedPassword123');
      
      // Mock Usuario.findOne to return null (user doesn't exist)
      Usuario.findOne.mockResolvedValue(null);
      
      // Mock Usuario.create
      const mockUser = {
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword123',
        rol: 'cliente',
        telefono: '1234567890',
        toJSON: () => ({
          id: 1,
          nombre: 'Test User',
          email: 'test@example.com',
          rol: 'cliente',
          telefono: '1234567890'
        })
      };
      Usuario.create.mockResolvedValue(mockUser);
      
      // Mock token generation
      generarToken.mockReturnValue('fake-jwt-token');
      
      // Make the request
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          rol: 'cliente',
          telefono: '1234567890'
        });
        
      // Assertions
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
      expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(Usuario.create).toHaveBeenCalled();
      expect(generarToken).toHaveBeenCalledWith({ userId: 1, rol: 'cliente' });
    });

    it('should return 400 if user already exists', async () => {
      // Mock existing user
      Usuario.findOne.mockResolvedValue({
        id: 1,
        email: 'test@example.com'
      });
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          rol: 'cliente',
          telefono: '1234567890'
        });
        
      // Assertions
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'El usuario ya existe');
      expect(Usuario.create).not.toHaveBeenCalled();
    });

    it('should return 400 if validation fails', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          // Missing required fields
          email: 'test@example.com'
        });
        
      // Assertions
      expect(response.statusCode).toBe(400);
      expect(Usuario.findOne).not.toHaveBeenCalled();
      expect(Usuario.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully with correct credentials', async () => {
      // Mock user
      const mockUser = {
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword123',
        rol: 'cliente',
        telefono: '1234567890',
        toJSON: () => ({
          id: 1,
          nombre: 'Test User',
          email: 'test@example.com',
          rol: 'cliente',
          telefono: '1234567890'
        })
      };
      
      // Mock Usuario.findOne to return the mock user
      Usuario.findOne.mockResolvedValue(mockUser);
      
      // Mock bcrypt.compare to return true (password matches)
      bcrypt.compare.mockResolvedValue(true);
      
      // Mock token generation
      generarToken.mockReturnValue('fake-jwt-token');
      
      // Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
        
      // Assertions
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token', 'fake-jwt-token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
      expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(generarToken).toHaveBeenCalledWith({ userId: 1, rol: 'cliente' });
    });

    it('should return 400 if user does not exist', async () => {
      // Mock Usuario.findOne to return null (user doesn't exist)
      Usuario.findOne.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
        
      // Assertions
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'Credenciales inválidas');
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(generarToken).not.toHaveBeenCalled();
    });

    it('should return 400 if password is incorrect', async () => {
      // Mock user
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword123',
        rol: 'cliente'
      };
      
      // Mock Usuario.findOne to return the mock user
      Usuario.findOne.mockResolvedValue(mockUser);
      
      // Mock bcrypt.compare to return false (password doesn't match)
      bcrypt.compare.mockResolvedValue(false);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
        
      // Assertions
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'Credenciales inválidas');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword123');
      expect(generarToken).not.toHaveBeenCalled();
    });
  });
});
