const request = require('supertest');
const app = require('../../server');
const db = require('../../models');
const jwtUtils = require('../../utils/jwt');
const mailerUtils = require('../../utils/mailer');

// Mock dependencies
jest.mock('../../models', () => ({
  Usuario: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn()
  },
  Cliente: {
    create: jest.fn()
  },
  Dentista: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  sequelize: {
    transaction: jest.fn()
  },
  Sequelize: {
    Op: {
      gt: Symbol('gt')
    }
  }
}));

jest.mock('../../utils/jwt', () => ({
  generarJWT: jest.fn(),
  generarTokenResetPassword: jest.fn(),
  generarRefreshToken: jest.fn(),
  refrescarToken: jest.fn(),
  invalidarRefreshToken: jest.fn()
}));

jest.mock('../../utils/mailer', () => ({
  enviarCorreoRecuperacionPassword: jest.fn()
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

    it('should return 403 if dentist is inactive', async () => {
      const mockUser = {
        id: 2,
        nombre: 'Dentista Test',
        email: 'dentista@example.com',
        rol: 'dentista',
        estado: 'activo',
        validarPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(true)
      };

      db.Usuario.findOne.mockResolvedValue(mockUser);
      db.Dentista.findOne.mockResolvedValue({ id: 7, userId: 2, status: 'inactivo' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dentista@example.com',
          password: 'password123'
        });

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('message', 'Usuario inactivo. Por favor contacta al administrador.');
      expect(jwtUtils.generarJWT).not.toHaveBeenCalled();
      expect(jwtUtils.generarRefreshToken).not.toHaveBeenCalled();
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

  describe('POST /api/auth/forgot-password', () => {
    it('should generate reset token and send recovery email', async () => {
      const mockUser = {
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com',
        save: jest.fn().mockResolvedValue(true)
      };

      db.Usuario.findOne.mockResolvedValue(mockUser);
      jwtUtils.generarTokenResetPassword.mockReturnValue('123456');
      mailerUtils.enviarCorreoRecuperacionPassword.mockResolvedValue({
        sent: true
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Correo de recuperación enviado correctamente');
      expect(mockUser.save).toHaveBeenCalled();
      expect(jwtUtils.generarTokenResetPassword).toHaveBeenCalled();
      expect(mailerUtils.enviarCorreoRecuperacionPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        nombre: 'Test User',
        otp: '123456'
      });
    });

    it('should return 404 if email does not exist', async () => {
      db.Usuario.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'missing@example.com'
        });

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('message', 'No existe un usuario con ese correo electrónico');
      expect(mailerUtils.enviarCorreoRecuperacionPassword).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/verify-reset-token', () => {
    it('should verify a valid OTP code', async () => {
      db.Usuario.findOne.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        resetPasswordToken: '123456',
        resetPasswordExpires: new Date(Date.now() + 600000)
      });

      const response = await request(app)
        .post('/api/auth/verify-reset-token')
        .send({ token: '123456' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Token válido');
    });

    it('should return 401 if OTP code is invalid', async () => {
      db.Usuario.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/verify-reset-token')
        .send({ token: '654321' });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Token inválido o expirado');
    });
  });

  describe('POST /api/auth/reset-password/:token', () => {
    it('should reset password with a valid token', async () => {
      const mockUser = {
        id: 1,
        password: 'old-password',
        resetPasswordToken: 'reset-token-123',
        resetPasswordExpires: new Date(Date.now() + 3600000),
        save: jest.fn().mockResolvedValue(true)
      };

      db.Usuario.findOne.mockResolvedValue(mockUser);
      jwtUtils.generarJWT.mockResolvedValue('new-jwt-token');

      const response = await request(app)
        .post('/api/auth/reset-password/reset-token-123')
        .send({
          password: 'newpassword123',
          passwordConfirm: 'newpassword123'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('token', 'new-jwt-token');
      expect(response.body).toHaveProperty('message', 'Contraseña restablecida correctamente');
      expect(mockUser.save).toHaveBeenCalled();
      expect(jwtUtils.generarJWT).toHaveBeenCalledWith(1);
      expect(mockUser.password).toBe('newpassword123');
      expect(mockUser.resetPasswordToken).toBeNull();
      expect(mockUser.resetPasswordExpires).toBeNull();
    });

    it('should return 401 if token is invalid or expired', async () => {
      db.Usuario.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/reset-password/invalid-token')
        .send({
          password: 'newpassword123',
          passwordConfirm: 'newpassword123'
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Token inválido o expirado');
      expect(jwtUtils.generarJWT).not.toHaveBeenCalled();
    });
  });
});
