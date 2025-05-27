const { Cliente, Usuario, Cita, Servicio } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { CustomError } = require('../utils/errors');
const { sequelize } = require('../config/database');

/**
 * Servicio para análisis y seguimiento de pacientes recurrentes
 */
class SeguimientoService {
    
    /**
     * Identifica pacientes recurrentes (con más de N visitas)
     * @param {Number} minVisitas - Número mínimo de visitas para considerar paciente recurrente (default: 3)
     * @returns {Array} - Lista de pacientes recurrentes con sus datos
     */
    static async obtenerPacientesRecurrentes(minVisitas = 3) {
        try {
            // Agrupamos las citas por cliente y contamos
            const pacientesRecurrentes = await Cita.findAll({
                attributes: [
                    'cliente_id', 
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalVisitas']
                ],
                group: ['cliente_id'],
                having: Sequelize.literal(`COUNT(id) >= ${minVisitas}`),
                include: [{
                    model: Cliente,
                    attributes: ['id', 'historial_medico', 'alergias', 'fecha_registro'],
                    include: [{
                        model: Usuario,
                        attributes: ['nombre', 'email', 'telefono']
                    }]
                }],
                order: [[Sequelize.literal('totalVisitas'), 'DESC']]
            });

            return pacientesRecurrentes.map(cita => {
                const paciente = cita.Cliente;
                return {
                    id: paciente.id,
                    nombre: paciente.Usuario.nombre,
                    email: paciente.Usuario.email,
                    telefono: paciente.Usuario.telefono,
                    fecha_registro: paciente.fecha_registro,
                    historial_medico: paciente.historial_medico,
                    alergias: paciente.alergias,
                    total_visitas: parseInt(cita.dataValues.totalVisitas, 10)
                };
            });
        } catch (error) {
            throw new CustomError(error.message, 500, 'ERROR_SEGUIMIENTO_PACIENTES');
        }
    }

    /**
     * Identifica pacientes que no han regresado en un tiempo determinado
     * @param {Number} diasSinVisita - Días sin visita para considerarse inactivo (default: 90)
     * @returns {Array} - Lista de pacientes inactivos
     */
    static async obtenerPacientesInactivos(diasSinVisita = 90) {
        try {
            // Fecha límite
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - diasSinVisita);

            // Subconsulta para obtener la última visita de cada paciente
            const subconsulta = Cita.findAll({
                attributes: [
                    'cliente_id',
                    [Sequelize.fn('MAX', Sequelize.col('fecha_hora')), 'ultima_visita']
                ],
                group: ['cliente_id'],
                raw: true
            });

            // Esperar a que se resuelva la subconsulta
            const ultimasVisitas = await subconsulta;

            // Filtrar por pacientes cuya última visita fue antes de la fecha límite
            const clientesInactivos = [];
            
            for (const visita of ultimasVisitas) {
                if (new Date(visita.ultima_visita) < fechaLimite) {
                    const cliente = await Cliente.findByPk(visita.cliente_id, {
                        include: [{
                            model: Usuario,
                            attributes: ['nombre', 'email', 'telefono']
                        }],
                        attributes: ['id', 'historial_medico', 'fecha_registro']
                    });
                    
                    if (cliente) {
                        clientesInactivos.push({
                            id: cliente.id,
                            nombre: cliente.Usuario.nombre,
                            email: cliente.Usuario.email,
                            telefono: cliente.Usuario.telefono,
                            fecha_registro: cliente.fecha_registro,
                            historial_medico: cliente.historial_medico,
                            ultima_visita: visita.ultima_visita,
                            dias_sin_visita: Math.floor((new Date() - new Date(visita.ultima_visita)) / (1000 * 60 * 60 * 24))
                        });
                    }
                }
            }

            return clientesInactivos;
        } catch (error) {
            throw new CustomError(error.message, 500, 'ERROR_SEGUIMIENTO_PACIENTES');
        }
    }

    /**
     * Analiza el patrón de visitas de un paciente específico
     * @param {Number} clienteId - ID del cliente a analizar
     * @returns {Object} - Análisis de patrones de visita
     */
    static async analizarPatronVisitas(clienteId) {
        try {
            // Verificar que el cliente existe
            const cliente = await Cliente.findByPk(clienteId, {
                include: [{
                    model: Usuario,
                    attributes: ['nombre', 'email', 'telefono']
                }]
            });
            
            if (!cliente) {
                throw new CustomError('Cliente no encontrado', 404, 'NOT_FOUND');
            }
            
            // Obtener todas las citas del paciente
            const citas = await Cita.findAll({
                where: { cliente_id: clienteId },
                include: [{
                    model: Servicio,
                    attributes: ['id', 'nombre', 'precio']
                }],
                order: [['fecha_hora', 'ASC']]
            });
            
            if (citas.length < 2) {
                return {
                    cliente: {
                        id: cliente.id,
                        nombre: cliente.Usuario.nombre,
                        email: cliente.Usuario.email,
                        telefono: cliente.Usuario.telefono
                    },
                    analisis: {
                        mensaje: 'No hay suficientes visitas para analizar patrones',
                        total_visitas: citas.length
                    }
                };
            }
            
            // Calcular intervalos entre visitas
            const intervalos = [];
            for (let i = 1; i < citas.length; i++) {
                const intervalo = Math.floor(
                    (new Date(citas[i].fecha_hora) - new Date(citas[i-1].fecha_hora)) / 
                    (1000 * 60 * 60 * 24)
                );
                intervalos.push(intervalo);
            }
            
            // Calcular promedio de intervalos
            const promedioIntervalo = intervalos.reduce((a, b) => a + b, 0) / intervalos.length;
            
            // Servicios más frecuentes
            const servicios = {};
            citas.forEach(cita => {
                const servicioId = cita.Servicio.id;
                if (!servicios[servicioId]) {
                    servicios[servicioId] = {
                        id: servicioId,
                        nombre: cita.Servicio.nombre,
                        contador: 0
                    };
                }
                servicios[servicioId].contador++;
            });
            
            const serviciosFrecuentes = Object.values(servicios)
                .sort((a, b) => b.contador - a.contador)
                .slice(0, 3);
                
            // Días de la semana preferidos
            const diasPreferidos = [0, 0, 0, 0, 0, 0, 0]; // Dom, Lun, Mar, ...
            citas.forEach(cita => {
                const diaSemana = new Date(cita.fecha_hora).getDay(); // 0 = Domingo
                diasPreferidos[diaSemana]++;
            });
            
            const maxDia = Math.max(...diasPreferidos);
            const diasMasVisitados = [];
            const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            
            diasPreferidos.forEach((cantidad, idx) => {
                if (cantidad === maxDia) {
                    diasMasVisitados.push(nombresDias[idx]);
                }
            });
            
            // Horas preferidas
            const horasPreferidas = Array(24).fill(0);
            citas.forEach(cita => {
                const hora = new Date(cita.fecha_hora).getHours();
                horasPreferidas[hora]++;
            });
            
            const maxHora = Math.max(...horasPreferidas);
            const horasMasVisitadas = [];
            
            horasPreferidas.forEach((cantidad, idx) => {
                if (cantidad === maxHora) {
                    horasMasVisitadas.push(idx);
                }
            });
            
            // Calcular fecha estimada próxima visita
            const ultimaVisita = new Date(citas[citas.length - 1].fecha_hora);
            const proximaVisitaEstimada = new Date(ultimaVisita);
            proximaVisitaEstimada.setDate(proximaVisitaEstimada.getDate() + Math.round(promedioIntervalo));
            
            // Retornar análisis
            return {
                cliente: {
                    id: cliente.id,
                    nombre: cliente.Usuario.nombre,
                    email: cliente.Usuario.email,
                    telefono: cliente.Usuario.telefono
                },
                analisis: {
                    total_visitas: citas.length,
                    primera_visita: citas[0].fecha_hora,
                    ultima_visita: ultimaVisita,
                    promedio_intervalo_dias: Math.round(promedioIntervalo),
                    servicios_frecuentes: serviciosFrecuentes,
                    dias_preferidos: diasMasVisitados,
                    horas_preferidas: horasMasVisitadas,
                    proxima_visita_estimada: proximaVisitaEstimada
                },
                detalles: {
                    intervalos: intervalos,
                    citas: citas.map(c => ({
                        id: c.id,
                        fecha: c.fecha_hora,
                        servicio: c.Servicio.nombre,
                        estado: c.estado
                    }))
                }
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(error.message, 500, 'ERROR_ANALISIS_PACIENTE');
        }
    }
    
    /**
     * Genera recomendaciones para un cliente basadas en su historial
     * @param {Number} clienteId - ID del cliente
     * @returns {Object} - Recomendaciones para el cliente
     */
    static async generarRecomendaciones(clienteId) {
        try {
            // Obtener patrón de visitas
            const patronVisitas = await this.analizarPatronVisitas(clienteId);
            
            if (patronVisitas.analisis.total_visitas < 2) {
                return {
                    clienteId,
                    recomendaciones: [
                        'Registrar suficientes visitas para generar recomendaciones personalizadas',
                        'Configurar recordatorio para seguimiento general'
                    ]
                };
            }
            
            const recomendaciones = [];
            const acciones = [];
            
            // Recomendar basado en intervalo de visitas
            const diasDesdeUltima = Math.floor(
                (new Date() - new Date(patronVisitas.analisis.ultima_visita)) / 
                (1000 * 60 * 60 * 24)
            );
            
            if (diasDesdeUltima > patronVisitas.analisis.promedio_intervalo_dias * 1.5) {
                recomendaciones.push(
                    `El paciente no ha regresado en ${diasDesdeUltima} días, lo cual supera su intervalo promedio de ${patronVisitas.analisis.promedio_intervalo_dias} días.`
                );
                
                acciones.push({
                    tipo: 'contacto',
                    descripcion: 'Contactar al paciente para consultar su estado',
                    prioridad: 'alta'
                });
            } else if (diasDesdeUltima > patronVisitas.analisis.promedio_intervalo_dias * 0.8) {
                recomendaciones.push(
                    `El paciente está próximo a su intervalo habitual de visitas (${diasDesdeUltima} días desde la última visita).`
                );
                
                acciones.push({
                    tipo: 'recordatorio',
                    descripcion: 'Enviar recordatorio preventivo para su próxima cita',
                    prioridad: 'media'
                });
            }
            
            // Recomendar basado en servicios frecuentes
            if (patronVisitas.analisis.servicios_frecuentes && 
                patronVisitas.analisis.servicios_frecuentes.length > 0) {
                
                const servicioFrecuente = patronVisitas.analisis.servicios_frecuentes[0];
                
                recomendaciones.push(
                    `El paciente utiliza con frecuencia el servicio "${servicioFrecuente.nombre}" (${servicioFrecuente.contador} veces).`
                );
                
                if (servicioFrecuente.nombre.toLowerCase().includes('limpieza')) {
                    acciones.push({
                        tipo: 'programa',
                        descripcion: 'Ofrecer programa de mantenimiento periódico',
                        prioridad: 'media'
                    });
                }
                
                // Recomendaciones específicas según tipo de servicio
                if (servicioFrecuente.nombre.toLowerCase().includes('ortodoncia')) {
                    recomendaciones.push(
                        'El paciente se encuentra en tratamiento de ortodoncia, es importante el seguimiento regular.'
                    );
                    
                    acciones.push({
                        tipo: 'seguimiento',
                        descripcion: 'Agendar citas de seguimiento periódicas para su tratamiento',
                        prioridad: 'alta'
                    });
                }
            }
            
            // Recomendaciones de horario
            if (patronVisitas.analisis.dias_preferidos && 
                patronVisitas.analisis.horas_preferidas) {
                
                recomendaciones.push(
                    `El paciente prefiere visitas los días ${patronVisitas.analisis.dias_preferidos.join(', ')} ` +
                    `en horario cercano a las ${patronVisitas.analisis.horas_preferidas.map(h => `${h}:00`).join(', ')}.`
                );
                
                acciones.push({
                    tipo: 'preferencia',
                    descripcion: `Recomendar citas en su horario preferido: ${patronVisitas.analisis.dias_preferidos[0]} a las ${patronVisitas.analisis.horas_preferidas[0]}:00`,
                    prioridad: 'baja'
                });
            }
            
            // Si hay una fecha estimada para próxima visita
            if (patronVisitas.analisis.proxima_visita_estimada) {
                const fechaEstimada = new Date(patronVisitas.analisis.proxima_visita_estimada);
                
                recomendaciones.push(
                    `Según el patrón histórico, se estima que el paciente requiera una nueva visita alrededor del ${fechaEstimada.toISOString().split('T')[0]}.`
                );
                
                // Si la fecha estimada es próxima o ya pasó
                const hoy = new Date();
                if (fechaEstimada <= hoy) {
                    acciones.push({
                        tipo: 'contacto',
                        descripcion: 'Contactar al paciente para programar nueva cita (fecha estimada ya pasó)',
                        prioridad: 'alta'
                    });
                } else {
                    const diasHastaEstimada = Math.floor((fechaEstimada - hoy) / (1000 * 60 * 60 * 24));
                    
                    if (diasHastaEstimada <= 14) {
                        acciones.push({
                            tipo: 'recordatorio',
                            descripcion: 'Programar recordatorio para próxima cita estimada',
                            prioridad: 'media',
                            fecha_sugerida: fechaEstimada
                        });
                    }
                }
            }
            
            return {
                clienteId,
                cliente: patronVisitas.cliente,
                recomendaciones,
                acciones,
                proxima_visita_estimada: patronVisitas.analisis.proxima_visita_estimada,
                ultima_visita: patronVisitas.analisis.ultima_visita,
                intervalo_promedio_dias: patronVisitas.analisis.promedio_intervalo_dias
            };
            
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(error.message, 500, 'ERROR_RECOMENDACIONES');
        }
    }
}

module.exports = SeguimientoService;
