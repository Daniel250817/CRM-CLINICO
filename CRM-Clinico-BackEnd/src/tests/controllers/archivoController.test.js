const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../server');
const { Cliente } = require('../models/Cliente');
const { Cita } = require('../models/Cita');

// Mock dependencies
jest.mock('../models/Cliente');
jest.mock('../models/Cita');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  unlinkSync: jest.fn(),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn()
}));
jest.mock('../middlewares/auth', () => ({
  verificarToken: (req, res, next) => {
    req.usuario = { id: 1, rol: 'admin' };
    next();
  },
  verificarRol: (roles) => (req, res, next) => next()
}));

describe('Archivo Controller', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/archivos/medical-records/:clienteId', () => {
    it('should upload a medical record successfully', async () => {
      // Mock client
      const mockClient = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };
      
      // Mock Cliente.findByPk
      Cliente.findByPk.mockResolvedValue(mockClient);
      
      // Create a test file path
      const testFilePath = path.join(__dirname, 'test-file.pdf');
      
      const response = await request(app)
        .post('/api/archivos/medical-records/1')
        .attach('file', testFilePath)
        .set('Authorization', 'Bearer fake-token');
        
      // Assertions
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Cliente.findByPk).toHaveBeenCalledWith('1');
      expect(mockClient.update).toHaveBeenCalled();
    });

    it('should return 404 if client not found', async () => {
      // Mock Cliente.findByPk to return null
      Cliente.findByPk.mockResolvedValue(null);
      
      // Create a test file path
      const testFilePath = path.join(__dirname, 'test-file.pdf');
      
      const response = await request(app)
        .post('/api/archivos/medical-records/999')
        .attach('file', testFilePath)
        .set('Authorization', 'Bearer fake-token');
        
      // Assertions
      expect(response.statusCode).toBe(404);
      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('POST /api/archivos/xrays/:citaId', () => {
    it('should upload an x-ray successfully', async () => {
      // Mock appointment
      const mockAppointment = {
        id: 1,
        notas: '{}',
        update: jest.fn().mockResolvedValue(true)
      };
      
      // Mock Cita.findByPk
      Cita.findByPk.mockResolvedValue(mockAppointment);
      
      // Create a test file path
      const testFilePath = path.join(__dirname, 'test-image.jpg');
      
      const response = await request(app)
        .post('/api/archivos/xrays/1')
        .attach('file', testFilePath)
        .set('Authorization', 'Bearer fake-token');
        
      // Assertions
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Cita.findByPk).toHaveBeenCalledWith('1');
      expect(mockAppointment.update).toHaveBeenCalled();
    });

    it('should return 404 if appointment not found', async () => {
      // Mock Cita.findByPk to return null
      Cita.findByPk.mockResolvedValue(null);
      
      // Create a test file path
      const testFilePath = path.join(__dirname, 'test-image.jpg');
      
      const response = await request(app)
        .post('/api/archivos/xrays/999')
        .attach('file', testFilePath)
        .set('Authorization', 'Bearer fake-token');
        
      // Assertions
      expect(response.statusCode).toBe(404);
      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('GET /api/archivos/medical-records/:clienteId', () => {
    it('should return 404 if client not found', async () => {
      // Mock Cliente.findByPk to return null
      Cliente.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/archivos/medical-records/999')
        .set('Authorization', 'Bearer fake-token');
        
      // Assertions
      expect(response.statusCode).toBe(404);
    });

    it('should return 404 if client has no medical record', async () => {
      // Mock client with no medical record
      const mockClient = {
        id: 1,
        historial_medico: null
      };
      
      // Mock Cliente.findByPk
      Cliente.findByPk.mockResolvedValue(mockClient);
      
      const response = await request(app)
        .get('/api/archivos/medical-records/1')
        .set('Authorization', 'Bearer fake-token');
        
      // Assertions
      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/archivos/xrays/:citaId', () => {
    it('should return 404 if appointment not found', async () => {
      // Mock Cita.findByPk to return null
      Cita.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/archivos/xrays/999')
        .set('Authorization', 'Bearer fake-token');
        
      // Assertions
      expect(response.statusCode).toBe(404);
    });

    it('should return 404 if appointment has no x-ray', async () => {
      // Mock appointment with no x-ray
      const mockAppointment = {
        id: 1,
        notas: '{}'
      };
      
      // Mock Cita.findByPk
      Cita.findByPk.mockResolvedValue(mockAppointment);
      
      const response = await request(app)
        .get('/api/archivos/xrays/1')
        .set('Authorization', 'Bearer fake-token');
        
      // Assertions
      expect(response.statusCode).toBe(404);
    });
  });
});
