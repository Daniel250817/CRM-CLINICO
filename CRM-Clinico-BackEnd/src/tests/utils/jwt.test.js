const jwt = require('jsonwebtoken');
const { generarToken, verifyToken } = require('../../utils/jwt');

// Mock dependencies
jest.mock('jsonwebtoken');

describe('JWT Utilities', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generarToken', () => {
    it('should generate a token with the provided payload', () => {
      // Mock jwt.sign to return a token
      const mockToken = 'mocked.jwt.token';
      jwt.sign.mockReturnValue(mockToken);
      
      // Sample payload
      const payload = { userId: 1, rol: 'admin' };
      
      // Call the function
      const token = generarToken(payload);
      
      // Assertions
      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify and return the decoded token', () => {
      // Mock jwt.verify to return decoded token
      const mockDecodedToken = { userId: 1, rol: 'admin', iat: 1234567890, exp: 9876543210 };
      jwt.verify.mockReturnValue(mockDecodedToken);
      
      // Call the function
      const result = verifyToken('some.jwt.token');
      
      // Assertions
      expect(result).toEqual(mockDecodedToken);
      expect(jwt.verify).toHaveBeenCalledWith('some.jwt.token', expect.any(String));
    });

    it('should throw an error if token is invalid', () => {
      // Mock jwt.verify to throw an error
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });
      
      // Call the function and expect it to throw
      expect(() => {
        verifyToken('invalid.token');
      }).toThrow();
      
      expect(jwt.verify).toHaveBeenCalledWith('invalid.token', expect.any(String));
    });
  });
});
