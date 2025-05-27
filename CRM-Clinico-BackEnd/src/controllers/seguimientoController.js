const SeguimientoService = require('../services/seguimientoService');
const { CustomError } = require('../utils/errors');

/**
 * Obtener todos los pacientes recurrentes
 */
exports.obtenerPacientesRecurrentes = async (req, res, next) => {
    try {
        const minVisitas = req.query.minVisitas ? parseInt(req.query.minVisitas) : 3;
        const pacientes = await SeguimientoService.obtenerPacientesRecurrentes(minVisitas);
        
        res.status(200).json({
            total: pacientes.length,
            pacientes
        });
    } catch (error) {
        next(new CustomError(error.message, 500, 'ERROR_SEGUIMIENTO_PACIENTES'));
    }
};

/**
 * Obtener pacientes inactivos (sin visitas recientes)
 */
exports.obtenerPacientesInactivos = async (req, res, next) => {
    try {
        const diasSinVisita = req.query.dias ? parseInt(req.query.dias) : 90;
        const pacientes = await SeguimientoService.obtenerPacientesInactivos(diasSinVisita);
        
        res.status(200).json({
            total: pacientes.length,
            diasSinVisita,
            pacientes
        });
    } catch (error) {
        next(new CustomError(error.message, 500, 'ERROR_SEGUIMIENTO_PACIENTES'));
    }
};

/**
 * Analizar patrón de visitas de un paciente específico
 */
exports.analizarPatronVisitas = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new CustomError('ID de cliente no proporcionado', 400, 'BAD_REQUEST'));
        }
        
        const analisis = await SeguimientoService.analizarPatronVisitas(id);
        res.status(200).json(analisis);
    } catch (error) {
        next(error instanceof CustomError ? error : new CustomError(error.message, 500, 'ERROR_ANALISIS_PACIENTE'));
    }
};

/**
 * Generar recomendaciones para un paciente específico
 */
exports.generarRecomendaciones = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new CustomError('ID de cliente no proporcionado', 400, 'BAD_REQUEST'));
        }
        
        const recomendaciones = await SeguimientoService.generarRecomendaciones(id);
        res.status(200).json(recomendaciones);
    } catch (error) {
        next(error instanceof CustomError ? error : new CustomError(error.message, 500, 'ERROR_RECOMENDACIONES'));
    }
};
