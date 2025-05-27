const { verificarToken, verificarRol } = require('../../middlewares/auth');
const { verifyToken } = require('../../utils/jwt');
const { Usuario } = require('../../models/Usuario');

// Mocking dependencies
jest.mock('../../utils/jwt');
jest.mock('../../models/Usuario');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {},
      usuario: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('verificarToken', () => {
    it('should pass if token is valid', async () => {
      // Mock request with authorization header
      req.headers.authorization = 'Bearer valid-token';
      
      // Mock token verification
      verifyToken.mockReturnValue({ userId: 1, rol: 'admin' });
      
      // Mock user lookup
      Usuario.findByPk.mockResolvedValue({ id: 1, rol: 'admin' });
      
      await verificarToken(req, res, next);
      
      // Assertions
      expect(verifyToken).toHaveBeenCalledWith('valid-token');
      expect(Usuario.findByPk).toHaveBeenCalledWith(1);
      expect(req.usuario).toEqual({ id: 1, rol: 'admin' });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no token provided', async () => {
      // No authorization header
      
      await verificarToken(req, res, next);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'No token, autorización denegada' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token format is invalid', async () => {
      // Invalid token format
      req.headers.authorization = 'invalid-format';
      
      await verificarToken(req, res, next);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Formato de token inválido' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token verification fails', async () => {
      // Mock request with authorization header
      req.headers.authorization = 'Bearer invalid-token';
      
      // Mock token verification to throw an error
      verifyToken.mockImplementation(() => {
        throw new Error('Token inválido');
      });
      
      await verificarToken(req, res, next);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      // Mock request with authorization header
      req.headers.authorization = 'Bearer valid-token';
      
      // Mock token verification
      verifyToken.mockReturnValue({ userId: 999, rol: 'admin' });
      
      // Mock user lookup to return null (user not found)
      Usuario.findByPk.mockResolvedValue(null);
      
      await verificarToken(req, res, next);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('verificarRol', () => {
    it('should pass if user has required role', () => {
      // Set up user in request
      req.usuario = { id: 1, rol: 'admin' };
      
      // Create middleware with required roles
      const middleware = verificarRol(['admin', 'dentista']);
      
      // Call middleware
      middleware(req, res, next);
      
      // Assertions
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      // Set up user in request with unauthorized role
      req.usuario = { id: 1, rol: 'cliente' };
      
      // Create middleware with required roles
      const middleware = verificarRol(['admin', 'dentista']);
      
      // Call middleware
      middleware(req, res, next);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acceso denegado: rol insuficiente' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
