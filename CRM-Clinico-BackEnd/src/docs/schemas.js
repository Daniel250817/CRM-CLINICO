/**
 * @swagger
 * components:
 *  schemas:
 *    Usuario:
 *      type: object
 *      required:
 *        - nombre
 *        - email
 *        - password
 *        - rol
 *      properties:
 *        id:
 *          type: integer
 *          description: ID auto-generado del usuario
 *        nombre:
 *          type: string
 *          description: Nombre completo del usuario
 *        email:
 *          type: string
 *          description: Correo electrónico del usuario
 *          format: email
 *        password:
 *          type: string
 *          description: Contraseña del usuario (encriptada)
 *          format: password
 *        rol:
 *          type: string
 *          description: Rol del usuario en el sistema
 *          enum: [admin, dentista, cliente]
 *        telefono:
 *          type: string
 *          description: Número de teléfono del usuario
 *        createdAt:
 *          type: string
 *          format: date-time
 *          description: Fecha de creación del registro
 *        updatedAt:
 *          type: string
 *          format: date-time
 *          description: Fecha de última actualización del registro
 *      example:
 *        id: 1
 *        nombre: Juan Pérez
 *        email: juan@example.com
 *        password: (encrypted)
 *        rol: cliente
 *        telefono: "1234567890"
 *        createdAt: "2025-05-20T14:30:00Z"
 *        updatedAt: "2025-05-20T14:30:00Z"
 * 
 *    Cliente:
 *      type: object
 *      required:
 *        - userId
 *      properties:
 *        id:
 *          type: integer
 *          description: ID auto-generado del cliente
 *        userId:
 *          type: integer
 *          description: ID del usuario asociado
 *        historial_medico:
 *          type: string
 *          description: Historial médico del cliente
 *        alergias:
 *          type: string
 *          description: Alergias que tiene el cliente
 *        fecha_registro:
 *          type: string
 *          format: date
 *          description: Fecha de registro del cliente
 *        createdAt:
 *          type: string
 *          format: date-time
 *        updatedAt:
 *          type: string
 *          format: date-time
 *      example:
 *        id: 1
 *        userId: 1
 *        historial_medico: "El paciente tiene antecedentes de hipertensión"
 *        alergias: "Penicilina"
 *        fecha_registro: "2025-05-01"
 * 
 *    Dentista:
 *      type: object
 *      required:
 *        - userId
 *        - especialidad
 *      properties:
 *        id:
 *          type: integer
 *          description: ID auto-generado del dentista
 *        userId:
 *          type: integer
 *          description: ID del usuario asociado
 *        especialidad:
 *          type: string
 *          description: Especialidad del dentista
 *        horario_trabajo:
 *          type: string
 *          description: Horario de trabajo del dentista
 *        status:
 *          type: string
 *          description: Estado del dentista
 *          enum: [activo, inactivo, vacaciones]
 *      example:
 *        id: 1
 *        userId: 2
 *        especialidad: "Ortodoncia"
 *        horario_trabajo: "Lunes a Viernes 9:00-18:00"
 *        status: "activo"
 * 
 *    Cita:
 *      type: object
 *      required:
 *        - cliente_id
 *        - dentista_id
 *        - fecha_hora
 *        - servicio
 *      properties:
 *        id:
 *          type: integer
 *          description: ID auto-generado de la cita
 *        cliente_id:
 *          type: integer
 *          description: ID del cliente
 *        dentista_id:
 *          type: integer
 *          description: ID del dentista
 *        fecha_hora:
 *          type: string
 *          format: date-time
 *          description: Fecha y hora de la cita
 *        servicio:
 *          type: string
 *          description: Servicio o tratamiento a realizar
 *        estado:
 *          type: string
 *          description: Estado de la cita
 *          enum: [pendiente, confirmada, cancelada, completada]
 *        notas:
 *          type: string
 *          description: Notas adicionales sobre la cita
 *      example:
 *        id: 1
 *        cliente_id: 1
 *        dentista_id: 1
 *        fecha_hora: "2025-06-01T14:30:00Z"
 *        servicio: "Limpieza dental"
 *        estado: "confirmada"
 *        notas: "El paciente solicita anestesia local"
 * 
 *    Servicio:
 *      type: object
 *      required:
 *        - nombre
 *        - precio
 *        - duracion
 *      properties:
 *        id:
 *          type: integer
 *          description: ID auto-generado del servicio
 *        nombre:
 *          type: string
 *          description: Nombre del servicio
 *        descripcion:
 *          type: string
 *          description: Descripción del servicio
 *        precio:
 *          type: number
 *          description: Precio del servicio
 *        duracion:
 *          type: integer
 *          description: Duración del servicio en minutos
 *      example:
 *        id: 1
 *        nombre: "Limpieza dental profesional"
 *        descripcion: "Limpieza profunda con ultrasonido y pulido"
 *        precio: 75.50
 *        duracion: 60
 * 
 *    Tarea:
 *      type: object
 *      required:
 *        - titulo
 *        - asignado_a
 *        - fecha_limite
 *      properties:
 *        id:
 *          type: integer
 *          description: ID auto-generado de la tarea
 *        titulo:
 *          type: string
 *          description: Título de la tarea
 *        descripcion:
 *          type: string
 *          description: Descripción de la tarea
 *        asignado_a:
 *          type: integer
 *          description: ID del usuario asignado
 *        fecha_limite:
 *          type: string
 *          format: date
 *          description: Fecha límite para completar la tarea
 *        estado:
 *          type: string
 *          description: Estado de la tarea
 *          enum: [pendiente, en_progreso, completada, cancelada]
 *      example:
 *        id: 1
 *        titulo: "Llamada de seguimiento"
 *        descripcion: "Llamar al paciente para confirmar resultados"
 *        asignado_a: 2
 *        fecha_limite: "2025-05-25"
 *        estado: "pendiente"
 * 
 *    Notificacion:
 *      type: object
 *      required:
 *        - usuario_id
 *        - mensaje
 *      properties:
 *        id:
 *          type: integer
 *          description: ID auto-generado de la notificación
 *        usuario_id:
 *          type: integer
 *          description: ID del usuario destinatario
 *        mensaje:
 *          type: string
 *          description: Mensaje de la notificación
 *        fecha:
 *          type: string
 *          format: date-time
 *          description: Fecha y hora de la notificación
 *        leida:
 *          type: boolean
 *          description: Indica si la notificación ha sido leída
 *      example:
 *        id: 1
 *        usuario_id: 1
 *        mensaje: "Recordatorio: tiene una cita mañana a las 10:00"
 *        fecha: "2025-05-20T08:00:00Z"
 *        leida: false
 * 
 *    AuthResponse:
 *      type: object
 *      properties:
 *        token:
 *          type: string
 *          description: JWT token para autenticación
 *        user:
 *          $ref: '#/components/schemas/Usuario'
 * 
 *    Error:
 *      type: object
 *      properties:
 *        message:
 *          type: string
 *          description: Mensaje de error
 *        code:
 *          type: string
 *          description: Código de error
 * 
 *  responses:
 *    BadRequest:
 *      description: Datos inválidos o solicitud mal formada
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Error'
 *          example:
 *            message: "Los datos proporcionados no son válidos"
 *            code: "BAD_REQUEST"
 *    Unauthorized:
 *      description: No autorizado
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Error'
 *          example:
 *            message: "No token, autorización denegada"
 *            code: "UNAUTHORIZED"
 *    Forbidden:
 *      description: Prohibido - No tiene suficientes permisos
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Error'
 *          example:
 *            message: "Acceso denegado: rol insuficiente"
 *            code: "FORBIDDEN"
 *    NotFound:
 *      description: Recurso no encontrado
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Error'
 *          example:
 *            message: "Recurso no encontrado"
 *            code: "NOT_FOUND"
 *    ConflictError:
 *      description: Conflicto con el estado actual del recurso
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Error'
 *          example:
 *            message: "Ya existe un recurso con estos datos"
 *            code: "CONFLICT"
 *    InternalServerError:
 *      description: Error interno del servidor
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Error'
 *          example:
 *            message: "Error interno del servidor"
 *            code: "INTERNAL_SERVER_ERROR"
 *  
 *  parameters:
 *    idParam:
 *      in: path
 *      name: id
 *      description: ID del recurso
 *      required: true
 *      schema:
 *        type: integer
 *    tokenAuth:
 *      in: header
 *      name: Authorization
 *      description: Bearer token de autenticación JWT
 *      required: true
 *      schema:
 *        type: string
 *        example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
