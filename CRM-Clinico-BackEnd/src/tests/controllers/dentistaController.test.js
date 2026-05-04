const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

jest.mock('../../models', () => ({
  Usuario: {
    findByPk: jest.fn()
  },
  Dentista: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn()
  },
  Sequelize: {
    Op: {
      ne: Symbol('ne')
    }
  }
}));

jest.mock('../../middlewares/auth', () => ({
  protegerRuta: (req, res, next) => {
    req.usuario = { id: 1, rol: 'admin' };
    next();
  },
  restringirA: () => (req, res, next) => next()
}));

describe('Dentista Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/dentistas', () => {
    it('should create a dentist successfully', async () => {
      db.Usuario.findByPk.mockResolvedValue({ id: 10, nombre: 'Dentista User' });
      db.Dentista.findOne.mockResolvedValue(null);
      db.Dentista.create.mockResolvedValue({ id: 5, userId: 10 });
      db.Dentista.findByPk.mockResolvedValue({
        id: 5,
        userId: 10,
        especialidad: 'Ortodoncia',
        usuario: {
          id: 10,
          nombre: 'Dentista User',
          email: 'dentista@example.com',
          telefono: '12345678'
        }
      });

      const response = await request(app)
        .post('/api/dentistas')
        .set('Authorization', 'Bearer fake-token')
        .send({
          userId: 10,
          especialidad: 'Ortodoncia',
          horarioTrabajo: {
            lunes: [{ inicio: '09:00', fin: '13:00' }]
          }
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Dentista creado correctamente');
      expect(response.body).toHaveProperty('data');
      expect(db.Usuario.findByPk).toHaveBeenCalledWith(10);
      expect(db.Dentista.create).toHaveBeenCalled();
      expect(db.Dentista.findByPk).toHaveBeenCalledWith(5, {
        include: {
          model: db.Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email', 'telefono']
        }
      });
    });

    it('should return 404 when user does not exist', async () => {
      db.Usuario.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/dentistas')
        .set('Authorization', 'Bearer fake-token')
        .send({
          userId: 999,
          especialidad: 'Ortodoncia'
        });

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('message', 'No existe un usuario con ID: 999');
      expect(db.Dentista.create).not.toHaveBeenCalled();
    });
  });
});
