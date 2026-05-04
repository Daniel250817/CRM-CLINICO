const request = require('supertest');
const app = require('../../server');
const db = require('../../models');
const jwtUtils = require('../../utils/jwt');

// Mock dependencies
jest.mock('../../models', () => ({
  Usuario: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  Cliente: {
    create: jest.fn()
  },
  Dentista: {
    create: jest.fn()
  },
  sequelize: {
    transaction: jest.fn()
  }
}));

jest.mock('../../utils/jwt', () => ({
  generarJWT: jest.fn(),
  generarTokenResetPassword: jest.fn(),
  generarRefreshToken: jest.fn(),
  refrescarToken: jest.fn(),
  invalidarRefreshToken: jest.fn()
}));

describe('Auth Controller', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock Usuario.findOne to return null (user doesn't exist)
      db.Usuario.findOne.mockResolvedValue(null);

      // Mock transaction flow
      const mockUser = {
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com',
        rol: 'cliente'
      };

      db.Usuario.create.mockResolvedValue(mockUser);
      db.Cliente.create.mockResolvedValue({ id: 1 });
      db.sequelize.transaction.mockImplementation(async (fn) => fn());

      // Mock token generation
      jwtUtils.generarJWT.mockResolvedValue('fake-jwt-token');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          passwordConfirm: 'password123',
          rol: 'cliente',
          telefono: '1234567890'
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('token', 'fake-jwt-token');
      expect(response.body).toHaveProperty('data');
      expect(db.Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(db.Usuario.create).toHaveBeenCalled();
      expect(db.Cliente.create).toHaveBeenCalled();
      expect(jwtUtils.generarJWT).toHaveBeenCalledWith(1);
    });

    it('should return 401 if user already exists', async () => {
      db.Usuario.findOne.mockResolvedValue({ id: 1, email: 'test@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          passwordConfirm: 'password123',
          rol: 'cliente',
          telefono: '1234567890'
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Este correo electrónico ya está registrado');
      expect(db.Usuario.create).not.toHaveBeenCalled();
    });

    it('should return 422 if validation fails', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
        });

      expect(response.statusCode).toBe(422);
      expect(db.Usuario.findOne).not.toHaveBeenCalled();
      expect(db.Usuario.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully with correct credentials', async () => {
      const mockUser = {
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com',
        rol: 'cliente',
        validarPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(true)
      };

      db.Usuario.findOne.mockResolvedValue(mockUser);
      jwtUtils.generarJWT.mockResolvedValue('fake-jwt-token');
      jwtUtils.generarRefreshToken.mockResolvedValue('fake-refresh-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('token', 'fake-jwt-token');
      expect(response.body).toHaveProperty('refreshToken', 'fake-refresh-token');
      expect(response.body).toHaveProperty('data');
      expect(db.Usuario.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        attributes: ['id', 'nombre', 'email', 'password', 'rol']
      });
      expect(mockUser.validarPassword).toHaveBeenCalledWith('password123');
      expect(jwtUtils.generarJWT).toHaveBeenCalledWith(1);
      expect(jwtUtils.generarRefreshToken).toHaveBeenCalledWith(1);
    });

    it('should return 401 if user does not exist', async () => {
      db.Usuario.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Las credenciales proporcionadas son incorrectas');
      expect(jwtUtils.generarJWT).not.toHaveBeenCalled();
    });

    it('should return 401 if password is incorrect', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        rol: 'cliente',
        validarPassword: jest.fn().mockResolvedValue(false)
      };

      db.Usuario.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Las credenciales proporcionadas son incorrectas');
      expect(mockUser.validarPassword).toHaveBeenCalledWith('wrongpassword');
      expect(jwtUtils.generarJWT).not.toHaveBeenCalled();
    });
  });
});
