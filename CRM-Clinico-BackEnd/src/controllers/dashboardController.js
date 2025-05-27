const { Cita, Cliente, Dentista, Servicio, Usuario } = require('../models');
const { Sequelize, QueryTypes, Op } = require('sequelize');
const db = require('../config/database').sequelize;
const { BadRequestError, NotFoundError, InternalServerError, UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Obtiene las estadísticas generales del dashboard
 */
exports.obtenerEstadisticasGenerales = async (req, res, next) => {
    try {
        if (!req || !req.usuario) {
            return next(new UnauthorizedError('Usuario no autenticado'));
        }

        const fechaHoy = new Date();
        fechaHoy.setHours(0, 0, 0, 0);
        const fechaFinHoy = new Date(fechaHoy);
        fechaFinHoy.setHours(23, 59, 59, 999);

        // Estructura base de respuesta con valores por defecto
        const estadisticasBase = {
            resumen: {
                totalClientes: 0,
                totalCitas: 0,
                totalDentistas: 0,
                totalServicios: 0,
                citasPendientes: 0,
                citasConfirmadas: 0,
                citasHoy: 0,
                ingresosTotales: 0
            },
            distribucionCitas: [],
            citasPorDia: [],
            serviciosMasSolicitados: [],
            dentistasMasActivos: [],
            nuevosClientesPorMes: [],
            tasaConversionPorMes: [],
            pacientesRecurrentes: []
        };

        try {
            // Conteos básicos usando modelos Sequelize
            const [
                totalClientes,
                totalCitas,
                totalDentistas,
                totalServicios,
                citasPendientes,
                citasConfirmadas,
                citasHoy
            ] = await Promise.all([
                Cliente.count().catch(() => 0),
                Cita.count().catch(() => 0),
                Dentista.count().catch(() => 0),
                Servicio.count().catch(() => 0),
                Cita.count({ where: { estado: 'pendiente' } }).catch(() => 0),
                Cita.count({ where: { estado: 'confirmada' } }).catch(() => 0),
                Cita.count({
                    where: {
                        fechaHora: {
                            [Op.between]: [fechaHoy, fechaFinHoy]
                        }
                    }
                }).catch(() => 0)
            ]);

            estadisticasBase.resumen = {
                ...estadisticasBase.resumen,
                totalClientes,
                totalCitas,
                totalDentistas,
                totalServicios,
                citasPendientes,
                citasConfirmadas,
                citasHoy
            };
        } catch (error) {
            logger.error('Error al obtener conteos básicos:', error);
            // Continuar con los valores por defecto
        }

        // Intentar obtener ingresos totales
        try {
            const ingresos = await Cita.findAll({
                where: { estado: 'completada' },
                include: [{
                    model: Servicio,
                    attributes: ['precio']
                }],
                raw: true
            }).catch(() => []);

            estadisticasBase.resumen.ingresosTotales = ingresos.reduce((total, cita) => {
                return total + (cita['Servicio.precio'] || 0);
            }, 0);
        } catch (error) {
            logger.error('Error al calcular ingresos:', error);
            // Mantener ingresos en 0
        }

        // Intentar obtener distribución de citas
        try {
            const distribucionCitas = await Cita.findAll({
                attributes: [
                    'estado',
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
                ],
                group: ['estado'],
                raw: true
            }).catch(() => []);

            estadisticasBase.distribucionCitas = distribucionCitas;
        } catch (error) {
            logger.error('Error al obtener distribución de citas:', error);
            // Mantener array vacío
        }

        // Intentar obtener citas por día
        try {
            const citasPorDia = await db.query(`
                SELECT 
                    DAYOFWEEK(fechaHora) as dia,
                    COUNT(*) as total
                FROM citas
                WHERE fechaHora >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DAYOFWEEK(fechaHora)
                ORDER BY dia
            `, { 
                type: QueryTypes.SELECT 
            });

            estadisticasBase.citasPorDia = citasPorDia;
        } catch (error) {
            logger.error('Error al obtener citas por día:', error);
            // Mantener array vacío
        }

        // Intentar obtener nuevos pacientes por mes
        try {
            logger.info('Iniciando consulta de nuevos pacientes por mes');

            // Obtener todos los clientes con sus usuarios
            const clientes = await Cliente.findAll({
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['createdAt', 'nombre']
                }],
                raw: true,
                nest: true
            });

            logger.info('Clientes encontrados:', clientes);

            // Agrupar por mes usando los datos verificados
            const clientesPorMes = {};
            clientes.forEach(cliente => {
                if (cliente.usuario && cliente.usuario.createdAt) {
                    const fecha = new Date(cliente.usuario.createdAt);
                    logger.info(`Procesando cliente con usuario ${cliente.usuario.nombre} creado en ${fecha}`);
                    const key = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
                    clientesPorMes[key] = (clientesPorMes[key] || 0) + 1;
                }
            });

            logger.info('Clientes agrupados por mes:', clientesPorMes);

            // Generar array de últimos 12 meses
            const ultimosMeses = [];
            const hoy = new Date();
            
            for (let i = 0; i < 12; i++) {
                const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
                const año = fecha.getFullYear();
                const mes = fecha.getMonth() + 1;
                const key = `${año}-${mes}`;
                
                ultimosMeses.push({
                    año,
                    mes,
                    total: clientesPorMes[key] || 0
                });
            }

            estadisticasBase.nuevosClientesPorMes = ultimosMeses.reverse();
            logger.info('Datos procesados de nuevos pacientes:', estadisticasBase.nuevosClientesPorMes);
        } catch (error) {
            logger.error('Error al obtener nuevos pacientes por mes:', error);
            logger.error('Stack trace:', error.stack);
            const hoy = new Date();
            estadisticasBase.nuevosClientesPorMes = Array.from({length: 12}, (_, i) => {
                const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
                return {
                    año: fecha.getFullYear(),
                    mes: fecha.getMonth() + 1,
                    total: 0
                };
            }).reverse();
        }

        res.status(200).json({
            estadisticas: estadisticasBase
        });
    } catch (error) {
        logger.error('Error al obtener estadísticas generales:', error);
        next(new InternalServerError('Error al obtener estadísticas generales'));
    }
};

/**
 * Obtiene estadísticas específicas de un dentista
 */
exports.obtenerEstadisticasDentista = async (req, res, next) => {
    try {
        const dentistaId = parseInt(req.params.id, 10);
          if (!dentistaId) {
            return next(new BadRequestError('ID de dentista no válido'));
        }
        
        // Verificar que el dentista existe
        const dentista = await Dentista.findByPk(dentistaId, {
            include: [{
                model: Usuario,
                attributes: ['nombre']
            }]
        });
          if (!dentista) {
            return next(new NotFoundError('Dentista no encontrado'));
        }
        
        // Estadísticas de citas
        const [
            totalCitas,
            citasCompletadas, 
            citasCanceladas,
            citasPendientes,
            citasHoy
        ] = await Promise.all([
            Cita.count({ where: { dentista_id: dentistaId }}),
            Cita.count({ where: { dentista_id: dentistaId, estado: 'completada' }}),
            Cita.count({ where: { dentista_id: dentistaId, estado: 'cancelada' }}),
            Cita.count({ where: { dentista_id: dentistaId, estado: 'pendiente' }}),            Cita.count({ 
                where: { 
                    dentista_id: dentistaId,
                    fecha_hora: {
                        [Op.between]: [
                            new Date(new Date().setHours(0, 0, 0, 0)), 
                            new Date(new Date().setHours(23, 59, 59, 999))
                        ]
                    }
                }
            })
        ]);
        
        // Servicios más realizados por este dentista
        const serviciosMasRealizados = await Sequelize.query(`
            SELECT s.nombre, COUNT(c.id) AS total
            FROM Citas c
            JOIN Servicios s ON c.servicio_id = s.id
            WHERE c.dentista_id = :dentistaId
            GROUP BY s.id
            ORDER BY total DESC
            LIMIT 5
        `, { 
            replacements: { dentistaId },
            type: QueryTypes.SELECT 
        });
          // Horarios más ocupados
        const horariosMasOcupados = await Sequelize.query(`
            SELECT 
                HOUR(fecha_hora) AS hora,
                COUNT(*) AS total
            FROM Citas
            WHERE dentista_id = :dentistaId
            GROUP BY HOUR(fecha_hora)
            ORDER BY total DESC
        `, { 
            replacements: { dentistaId },
            type: QueryTypes.SELECT 
        });
          // Ingresos generados
        const ingresos = await Sequelize.query(`
            SELECT 
                YEAR(c.fecha_hora) AS año,
                MONTH(c.fecha_hora) AS mes,
                SUM(s.precio) AS total
            FROM Citas c
            JOIN Servicios s ON c.servicio_id = s.id
            WHERE c.dentista_id = :dentistaId AND c.estado = 'completada'
            GROUP BY YEAR(c.fecha_hora), MONTH(c.fecha_hora)
            ORDER BY año DESC, mes DESC
            LIMIT 6
        `, { 
            replacements: { dentistaId },
            type: QueryTypes.SELECT 
        });
        
        res.status(200).json({
            dentista: {
                id: dentistaId,
                nombre: dentista.Usuario.nombre,
                especialidad: dentista.especialidad
            },
            estadisticas: {
                resumen: {
                    totalCitas,
                    citasCompletadas,
                    citasCanceladas,
                    citasPendientes,
                    citasHoy,
                    tasaCompletadas: totalCitas > 0 ? (citasCompletadas / totalCitas * 100).toFixed(2) : 0,
                    tasaCanceladas: totalCitas > 0 ? (citasCanceladas / totalCitas * 100).toFixed(2) : 0
                },
                serviciosMasRealizados,
                horariosMasOcupados,
                ingresos
            }
        });
          } catch (error) {
        next(new InternalServerError(`Error al obtener estadísticas del dentista: ${error.message}`));
    }
};

/**
 * Obtiene estadísticas específicas de un cliente
 */
exports.obtenerEstadisticasCliente = async (req, res, next) => {
    try {
        const clienteId = parseInt(req.params.id, 10);
          if (!clienteId) {
            return next(new BadRequestError('ID de cliente no válido'));
        }
        
        // Verificar que el cliente existe
        const cliente = await Cliente.findByPk(clienteId, {
            include: [{
                model: Usuario,
                attributes: ['nombre', 'email', 'telefono']
            }]
        });
          if (!cliente) {
            return next(new NotFoundError('Cliente no encontrado'));
        }
        
        // Historial de citas del cliente
        const historialCitas = await Cita.findAll({
            where: { cliente_id: clienteId },
            include: [
                {
                    model: Dentista,
                    include: [{
                        model: Usuario,
                        attributes: ['nombre']
                    }]
                },
                {
                    model: Servicio,
                    attributes: ['nombre', 'precio']
                }
            ],
            order: [['fecha_hora', 'DESC']],
            limit: 10
        });
          // Total de visitas por año
        const visitasPorAnio = await Sequelize.query(`
            SELECT 
                YEAR(fecha_hora) AS año,
                COUNT(*) AS total_visitas
            FROM Citas
            WHERE cliente_id = :clienteId
            GROUP BY YEAR(fecha_hora)
            ORDER BY año DESC
        `, { 
            replacements: { clienteId },
            type: QueryTypes.SELECT 
        });
        
        // Servicios más solicitados por este cliente
        const serviciosMasSolicitados = await Sequelize.query(`
            SELECT s.nombre, COUNT(c.id) AS total
            FROM Citas c
            JOIN Servicios s ON c.servicio_id = s.id
            WHERE c.cliente_id = :clienteId
            GROUP BY s.id
            ORDER BY total DESC
        `, { 
            replacements: { clienteId },
            type: QueryTypes.SELECT 
        });
        
        // Total gastado por el cliente
        const gastoTotal = await Sequelize.query(`
            SELECT 
                SUM(s.precio) AS total
            FROM Citas c
            JOIN Servicios s ON c.servicio_id = s.id
            WHERE c.cliente_id = :clienteId AND c.estado = 'completada'
        `, { 
            replacements: { clienteId },
            type: QueryTypes.SELECT 
        });
        
        // Tendencias de cancelación
        const tendenciaCancelaciones = await Sequelize.query(`
            SELECT 
                estado,
                COUNT(*) AS total
            FROM Citas
            WHERE cliente_id = :clienteId
            GROUP BY estado
        `, { 
            replacements: { clienteId },
            type: QueryTypes.SELECT 
        });
        
        res.status(200).json({
            cliente: {
                id: clienteId,
                nombre: cliente.Usuario.nombre,
                email: cliente.Usuario.email,
                telefono: cliente.Usuario.telefono,
                fecha_registro: cliente.fecha_registro
            },
            estadisticas: {
                resumen: {
                    totalCitas: historialCitas.length,
                    gastoTotal: gastoTotal.length > 0 ? parseFloat(gastoTotal[0].total || 0) : 0,
                    primeraCita: historialCitas.length > 0 ? historialCitas[historialCitas.length - 1].fecha_hora : null,
                    ultimaCita: historialCitas.length > 0 ? historialCitas[0].fecha_hora : null
                },
                historialCitas: historialCitas.map(cita => ({
                    id: cita.id,
                    fecha: cita.fecha_hora,
                    dentista: cita.Dentista.Usuario.nombre,
                    servicio: cita.Servicio.nombre,
                    precio: cita.Servicio.precio,
                    estado: cita.estado
                })),
                visitasPorAnio,
                serviciosMasSolicitados,
                tendenciaCancelaciones
            }
        });
          } catch (error) {
        next(new InternalServerError(`Error al obtener estadísticas del cliente: ${error.message}`));
    }
};

/**
 * Obtiene previsión de ingresos para los próximos meses
 */
exports.obtenerPrevisionIngresos = async (req, res, next) => {
    try {        // Ingresos históricos por mes (últimos 12 meses)
        const ingresosHistoricos = await Sequelize.query(`
            SELECT 
                YEAR(c.fecha_hora) AS año,
                MONTH(c.fecha_hora) AS mes,
                SUM(s.precio) AS total
            FROM Citas c
            JOIN Servicios s ON c.servicio_id = s.id
            WHERE 
                c.estado = 'completada' AND 
                c.fecha_hora >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY YEAR(c.fecha_hora), MONTH(c.fecha_hora)
            ORDER BY año, mes
        `, { type: QueryTypes.SELECT });
        
        // Ingresos previstos para los próximos 3 meses basados en citas confirmadas
        const ingresosProgramados = await Sequelize.query(`
            SELECT 
                YEAR(c.fecha_hora) AS año,
                MONTH(c.fecha_hora) AS mes,
                SUM(s.precio) AS total_programado
            FROM Citas c
            JOIN Servicios s ON c.servicio_id = s.id
            WHERE 
                c.estado IN ('confirmada', 'pendiente') AND
                c.fecha_hora BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
            GROUP BY YEAR(c.fecha_hora), MONTH(c.fecha_hora)
            ORDER BY año, mes
        `, { type: QueryTypes.SELECT });
        
        // Cálculo de tendencia basada en histórico (análisis simple)
        // Calculamos el promedio de incremento mensual de los últimos meses
        let incrementoPromedio = 0;
        
        if (ingresosHistoricos.length > 2) {
            let sumaDiferencias = 0;
            let contadorDiferencias = 0;
            
            for (let i = 1; i < ingresosHistoricos.length; i++) {
                const mesPrevio = parseFloat(ingresosHistoricos[i-1].total);
                const mesActual = parseFloat(ingresosHistoricos[i].total);
                
                if (mesPrevio > 0) {
                    sumaDiferencias += ((mesActual - mesPrevio) / mesPrevio);
                    contadorDiferencias++;
                }
            }
            
            incrementoPromedio = contadorDiferencias > 0 ? 
                (sumaDiferencias / contadorDiferencias) : 
                0;
        }
        
        // Proyección para próximos 6 meses
        const proyeccion = [];
        const fechaActual = new Date();
        let ultimoMes = ingresosHistoricos.length > 0 ? 
            parseFloat(ingresosHistoricos[ingresosHistoricos.length - 1].total) : 
            0;
            
        for (let i = 1; i <= 6; i++) {
            const fechaProyeccion = new Date(fechaActual);
            fechaProyeccion.setMonth(fechaActual.getMonth() + i);
            
            const año = fechaProyeccion.getFullYear();
            const mes = fechaProyeccion.getMonth() + 1;
            
            // Buscar si hay ingresos programados para este mes
            const programado = ingresosProgramados.find(
                item => item.año === año && item.mes === mes
            );
            
            // Calcular proyección
            ultimoMes = ultimoMes * (1 + incrementoPromedio);
            
            proyeccion.push({
                año,
                mes,
                proyeccion: parseFloat(ultimoMes.toFixed(2)),
                programado: programado ? parseFloat(programado.total_programado) : 0
            });
        }
        
        res.status(200).json({
            ingresosHistoricos: ingresosHistoricos.map(item => ({
                ...item,
                total: parseFloat(item.total)
            })),
            incrementoPromedio: parseFloat((incrementoPromedio * 100).toFixed(2)),
            proyeccion
        });
        
    } catch (error) {
        next(new InternalServerError(`Error al obtener previsión de ingresos: ${error.message}`));
    }
};
