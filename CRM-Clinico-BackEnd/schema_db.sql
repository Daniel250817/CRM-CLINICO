-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: crm_clinico
-- ------------------------------------------------------
-- Server version	8.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `citas`
--

DROP TABLE IF EXISTS `citas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clienteId` int NOT NULL,
  `dentistaId` int NOT NULL,
  `servicioId` int NOT NULL,
  `fechaHora` datetime NOT NULL,
  `estado` enum('pendiente','confirmada','completada','cancelada','no asistió') DEFAULT 'pendiente',
  `notas` text,
  `duracion` int DEFAULT NULL COMMENT 'Duración en minutos',
  `motivoCancelacion` varchar(255) DEFAULT NULL,
  `recordatorioEnviado` tinyint(1) DEFAULT '0',
  `confirmada` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cita_fecha` (`fechaHora`),
  KEY `idx_cita_dentista_fecha` (`dentistaId`,`fechaHora`),
  KEY `idx_cita_cliente_fecha` (`clienteId`,`fechaHora`),
  KEY `servicioId` (`servicioId`),
  CONSTRAINT `citas_ibfk_181` FOREIGN KEY (`clienteId`) REFERENCES `clientes` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `citas_ibfk_182` FOREIGN KEY (`dentistaId`) REFERENCES `dentistas` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `citas_ibfk_183` FOREIGN KEY (`servicioId`) REFERENCES `servicios` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citas`
--

LOCK TABLES `citas` WRITE;
/*!40000 ALTER TABLE `citas` DISABLE KEYS */;
INSERT INTO `citas` VALUES (1,1,1,2,'2025-05-30 00:05:00','pendiente','adasdad',45,NULL,0,0,'2025-05-27 05:46:10','2025-05-29 16:42:05'),(8,1,3,2,'2025-05-29 15:15:00','pendiente','asdasd',75,NULL,0,0,'2025-05-28 16:45:00','2025-05-28 21:12:30'),(9,11,3,2,'2025-05-29 16:45:00','confirmada','ñññ',45,NULL,0,0,'2025-05-28 16:47:09','2025-05-28 21:13:39'),(10,12,1,5,'2025-05-29 23:00:00','pendiente','cxd',45,NULL,0,0,'2025-05-29 15:48:57','2025-05-29 21:08:33');
/*!40000 ALTER TABLE `citas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `apellidos` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `historialMedico` json DEFAULT NULL,
  `alergias` text,
  `fechaRegistro` datetime NOT NULL,
  `fechaNacimiento` date DEFAULT NULL,
  `genero` enum('masculino','femenino','otro','prefiero no decir','no_especificado') DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `codigoPostal` varchar(10) DEFAULT NULL,
  `ocupacion` varchar(100) DEFAULT NULL,
  `estadoCivil` enum('soltero','casado','divorciado','viudo') DEFAULT NULL,
  `contactoEmergencia` json DEFAULT NULL,
  `telefonoEmergencia` varchar(20) DEFAULT NULL,
  `ultimaVisita` datetime DEFAULT NULL,
  `notas` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cliente_user` (`userId`),
  KEY `idx_cliente_fecha_registro` (`fechaRegistro`),
  CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,2,'cliente 241','guardado','portillo@gmail.com','12345671','{\"alergias\": \"asd\", \"cirugiasPrevias\": \"s989\", \"enfermedadesCronicas\": \"kllkl\", \"medicamentosActuales\": \"sslklk\"}',NULL,'2025-05-26 04:41:02','2025-04-18','otro','dasda','Mejicanos, Zacamil','06009','dsadasd','divorciado','{\"nombre\": \"mamanena\", \"relacion\": \"abuela\", \"telefono\": \"12345678\"}',NULL,NULL,NULL,'2025-05-26 04:41:02','2025-05-29 17:52:54'),(11,2,'Julio cliente','Guardado','juliomix089@gmail.com','79591765','{\"alergias\": \"asd\", \"cirugiasPrevias\": \"s989\", \"enfermedadesCronicas\": \"kllkl\", \"medicamentosActuales\": \"sslklk\"}',NULL,'2025-05-26 05:07:30','1966-05-23','no_especificado','San Salvador','Apopa','','asdasd','soltero','{\"nombre\": \"Roxana\", \"relacion\": \"asdasd\", \"telefono\": \"68686868\"}','79591765',NULL,NULL,'2025-05-26 05:07:30','2025-05-29 19:11:10'),(12,2,'Edificio','54','juliomix089@gmail.com','79591765','{\"alergias\": \"asdasd\", \"cirugiasPrevias\": \"dasd\", \"enfermedadesCronicas\": \"dasdas\", \"medicamentosActuales\": \"dasdas\"}',NULL,'2025-05-27 22:45:33',NULL,'no_especificado','Mejicanos, Zacamil, José Simeon Cañas, Gran Manzana, Edificio 111, Apartamento #54',NULL,NULL,'asd',NULL,'{\"nombre\": \"dassdasd\", \"relacion\": \"asdasd\", \"telefono\": \"adasd\"}',NULL,NULL,NULL,'2025-05-27 22:45:33','2025-05-27 22:45:33'),(13,2,'Edificio','54','juliomix089@gmail.com','79591765','{\"alergias\": \"zxczx\", \"cirugiasPrevias\": \"\", \"enfermedadesCronicas\": \"czxc\", \"medicamentosActuales\": \"\"}',NULL,'2025-05-27 22:50:33',NULL,'no_especificado','Mejicanos, Zacamil, José Simeon Cañas, Gran Manzana, Edificio 111, Apartamento #54',NULL,NULL,'dasdsa',NULL,'{\"nombre\": \"asdasd\", \"relacion\": \"zcxzcz\", \"telefono\": \"zxzczxc\"}',NULL,NULL,NULL,'2025-05-27 22:50:33','2025-05-27 22:50:33'),(14,2,'Edificio','54','juliomix089@gmail.com','79591765','{\"alergias\": \"d\", \"cirugiasPrevias\": \"x\", \"enfermedadesCronicas\": \"x\", \"medicamentosActuales\": \"x\"}',NULL,'2025-05-27 22:55:06',NULL,'no_especificado','Mejicanos, Zacamil, José Simeon Cañas, Gran Manzana, Edificio 111, Apartamento #54',NULL,NULL,NULL,NULL,'{\"nombre\": \"ddd\", \"relacion\": \"d\", \"telefono\": \"dd\"}',NULL,NULL,NULL,'2025-05-27 22:55:06','2025-05-27 22:55:06'),(15,3,'Julio','Guardado','juliomix089@gmail.com','79591765','{\"alergias\": null, \"cirugiasPrevias\": null, \"enfermedadesCronicas\": null, \"medicamentosActuales\": null}',NULL,'2025-05-27 23:11:16',NULL,'no_especificado','Apopa',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-05-27 23:11:16','2025-05-27 23:11:16'),(16,7,'Maynol','Maynol','maynol@gmail.com','12345678','{\"alergias\": \"\", \"cirugiasPrevias\": \"\", \"enfermedadesCronicas\": \"cancer\", \"medicamentosActuales\": \"\"}',NULL,'2025-05-29 17:10:19','1985-05-26','masculino','Cortintios','Corintios','06009','Dentista','soltero','{\"nombre\": \"maynola\", \"relacion\": \"mamá\", \"telefono\": \"12345678\"}',NULL,NULL,NULL,'2025-05-29 17:10:19','2025-05-29 19:02:46');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dentistas`
--

DROP TABLE IF EXISTS `dentistas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dentistas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  `horarioTrabajo` json DEFAULT NULL COMMENT 'JSON con los horarios de trabajo por día de la semana',
  `status` enum('activo','inactivo','vacaciones') DEFAULT 'activo',
  `titulo` varchar(100) DEFAULT NULL,
  `numeroColegiado` varchar(50) DEFAULT NULL,
  `añosExperiencia` int DEFAULT NULL,
  `biografia` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  UNIQUE KEY `numeroColegiado` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_2` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_3` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_4` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_5` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_6` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_7` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_8` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_9` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_10` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_11` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_12` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_13` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_14` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_15` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_16` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_17` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_18` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_19` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_20` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_21` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_22` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_23` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_24` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_25` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_26` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_27` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_28` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_29` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_30` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_31` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_32` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_33` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_34` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_35` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_36` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_37` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_38` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_39` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_40` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_41` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_42` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_43` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_44` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_45` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_46` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_47` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_48` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_49` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_50` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_51` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_52` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_53` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_54` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_55` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_56` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_57` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_58` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_59` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_60` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_61` (`numeroColegiado`),
  UNIQUE KEY `numeroColegiado_62` (`numeroColegiado`),
  CONSTRAINT `dentistas_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dentistas`
--

LOCK TABLES `dentistas` WRITE;
/*!40000 ALTER TABLE `dentistas` DISABLE KEYS */;
INSERT INTO `dentistas` VALUES (1,2,'Medico dentista','{\"lunes\": [{\"fin\": \"14:00\", \"inicio\": \"09:00\"}, {\"fin\": \"20:00\", \"inicio\": \"16:00\"}], \"jueves\": [{\"fin\": \"20:00\", \"inicio\": \"16:00\"}], \"martes\": [{\"fin\": \"14:00\", \"inicio\": \"09:00\"}, {\"fin\": \"20:00\", \"inicio\": \"16:00\"}], \"miercoles\": [{\"fin\": \"14:00\", \"inicio\": \"09:00\"}, {\"fin\": \"20:00\", \"inicio\": \"16:00\"}]}','activo','dasdasd','1233',4,'csdsad','2025-05-26 07:33:01','2025-05-28 04:53:51'),(3,1,'Medico anestesiólogo','\"{\\\"domingo\\\":[{\\\"inicio\\\":\\\"09:00\\\",\\\"fin\\\":\\\"18:00\\\"}],\\\"lunes\\\":[{\\\"inicio\\\":\\\"09:00\\\",\\\"fin\\\":\\\"18:00\\\"}],\\\"martes\\\":[{\\\"inicio\\\":\\\"09:00\\\",\\\"fin\\\":\\\"18:00\\\"}],\\\"miercoles\\\":[{\\\"inicio\\\":\\\"09:00\\\",\\\"fin\\\":\\\"18:00\\\"}],\\\"jueves\\\":[{\\\"inicio\\\":\\\"09:00\\\",\\\"fin\\\":\\\"18:00\\\"}],\\\"viernes\\\":[{\\\"inicio\\\":\\\"09:00\\\",\\\"fin\\\":\\\"18:00\\\"}],\\\"sabado\\\":[{\\\"inicio\\\":\\\"09:00\\\",\\\"fin\\\":\\\"18:00\\\"}]}\"','activo','Bachiller general diplomado en diseño gráfico','1233w332',3,'dasdasd','2025-05-26 08:05:27','2025-05-28 21:26:05'),(4,10,NULL,NULL,'activo',NULL,NULL,NULL,NULL,'2025-05-29 21:16:03','2025-05-29 21:16:03'),(5,11,NULL,NULL,'activo',NULL,NULL,NULL,NULL,'2025-05-29 21:19:20','2025-05-29 21:19:20'),(6,12,NULL,NULL,'activo',NULL,NULL,NULL,NULL,'2025-05-29 21:20:29','2025-05-29 21:20:29'),(7,13,NULL,NULL,'activo',NULL,NULL,NULL,NULL,'2025-05-29 21:21:07','2025-05-29 21:21:07');
/*!40000 ALTER TABLE `dentistas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documentos`
--

DROP TABLE IF EXISTS `documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documentos` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `clienteId` int NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tamano` int NOT NULL,
  `ruta` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `clienteId` (`clienteId`),
  CONSTRAINT `documentos_ibfk_1` FOREIGN KEY (`clienteId`) REFERENCES `clientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documentos`
--

LOCK TABLES `documentos` WRITE;
/*!40000 ALTER TABLE `documentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `documentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numeroFactura` varchar(255) NOT NULL,
  `citaId` int NOT NULL,
  `clienteId` int NOT NULL,
  `dentistaId` int NOT NULL,
  `concepto` text NOT NULL,
  `servicios` json NOT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `descuento` decimal(10,2) NOT NULL DEFAULT '0.00',
  `impuestos` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `estadoPago` enum('pendiente','pagada','vencida','cancelada') NOT NULL DEFAULT 'pendiente',
  `metodoPago` enum('efectivo','tarjeta','transferencia','paypal','otro') DEFAULT NULL,
  `fechaVencimiento` date NOT NULL,
  `fechaPago` datetime DEFAULT NULL,
  `notas` text,
  `paypalOrderId` varchar(255) DEFAULT NULL,
  `paypalPaymentId` varchar(255) DEFAULT NULL,
  `paypalPayerId` varchar(255) DEFAULT NULL,
  `paypalStatus` varchar(255) DEFAULT NULL,
  `fechaCreacion` datetime NOT NULL,
  `fechaActualizacion` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numeroFactura` (`numeroFactura`),
  KEY `citaId` (`citaId`),
  KEY `clienteId` (`clienteId`),
  KEY `dentistaId` (`dentistaId`),
  CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`citaId`) REFERENCES `citas` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `facturas_ibfk_2` FOREIGN KEY (`clienteId`) REFERENCES `clientes` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `facturas_ibfk_3` FOREIGN KEY (`dentistaId`) REFERENCES `dentistas` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuarioId` int NOT NULL,
  `mensaje` varchar(255) NOT NULL,
  `fecha` datetime NOT NULL,
  `leida` tinyint(1) DEFAULT '0',
  `tipo` enum('info','alerta','recordatorio','error') DEFAULT 'info',
  `entidadTipo` varchar(50) DEFAULT NULL COMMENT 'Tipo de entidad relacionada (cita, tarea, etc.)',
  `entidadId` int DEFAULT NULL COMMENT 'ID de la entidad relacionada',
  `accion` varchar(50) DEFAULT NULL COMMENT 'Acción relacionada (crear, actualizar, cancelar, etc.)',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notificacion_usuario` (`usuarioId`),
  KEY `idx_notificacion_leida` (`leida`),
  CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=201 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,2,'Nueva tarea asignada: dsadasd (Fecha límite: 26/5/2025)','2025-05-26 11:25:04',1,'info','tarea',1,'crear','2025-05-26 11:25:04','2025-05-26 11:47:41'),(2,2,'Tarea modificada: dsadasd (Fecha límite: 26/5/2025)','2025-05-26 11:27:08',1,'info','tarea',1,'actualizar','2025-05-26 11:27:08','2025-05-26 11:29:53'),(3,2,'Tarea modificada: dsadasd (Fecha límite: 26/5/2025)','2025-05-26 11:27:13',1,'info','tarea',1,'actualizar','2025-05-26 11:27:13','2025-05-26 11:29:54'),(4,2,'Nueva tarea asignada: dasdasd (Fecha límite: 26/5/2025)','2025-05-26 11:34:03',1,'info','tarea',2,'crear','2025-05-26 11:34:03','2025-05-26 11:46:22'),(5,2,'Tarea modificada: dasdasd (Fecha límite: 26/5/2025)','2025-05-26 11:34:08',1,'info','tarea',2,'actualizar','2025-05-26 11:34:08','2025-05-26 11:46:22'),(6,2,'Tarea modificada: dasdasd (Fecha límite: 26/5/2025)','2025-05-26 11:34:14',1,'info','tarea',2,'actualizar','2025-05-26 11:34:14','2025-05-26 11:46:22'),(7,2,'Nueva tarea asignada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:37:53',1,'info','tarea',3,'crear','2025-05-26 11:37:53','2025-05-26 11:46:22'),(8,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:40:54',1,'info','tarea',3,'actualizar','2025-05-26 11:40:54','2025-05-26 11:46:22'),(9,2,'Tarea marcada como completada: casdfas','2025-05-26 11:41:14',1,'info','tarea',3,'completar','2025-05-26 11:41:14','2025-05-26 11:46:22'),(10,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:43:28',1,'info','tarea',3,'actualizar','2025-05-26 11:43:28','2025-05-26 11:46:22'),(11,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:43:57',1,'info','tarea',3,'actualizar','2025-05-26 11:43:57','2025-05-26 11:46:22'),(12,2,'Tarea marcada como completada: casdfas','2025-05-26 11:43:59',1,'info','tarea',3,'completar','2025-05-26 11:43:59','2025-05-26 11:46:22'),(13,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:44:40',1,'info','tarea',3,'actualizar','2025-05-26 11:44:40','2025-05-26 11:46:16'),(14,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:44:40',1,'info','tarea',3,'actualizar','2025-05-26 11:44:40','2025-05-26 11:46:22'),(15,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:44:42',1,'info','tarea',3,'actualizar','2025-05-26 11:44:42','2025-05-26 11:46:14'),(16,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:44:44',1,'info','tarea',3,'actualizar','2025-05-26 11:44:44','2025-05-26 11:46:18'),(17,2,'Tarea marcada como completada: casdfas','2025-05-26 11:45:16',1,'info','tarea',3,'completar','2025-05-26 11:45:16','2025-05-26 11:46:22'),(18,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:45:17',1,'info','tarea',3,'actualizar','2025-05-26 11:45:17','2025-05-26 11:46:22'),(19,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:45:18',1,'info','tarea',3,'actualizar','2025-05-26 11:45:18','2025-05-26 11:46:22'),(20,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:48:48',1,'info','tarea',3,'actualizar','2025-05-26 11:48:48','2025-05-26 11:53:41'),(21,2,'Tarea marcada como completada: casdfas','2025-05-26 11:48:49',1,'info','tarea',3,'completar','2025-05-26 11:48:49','2025-05-26 11:53:40'),(22,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:48:51',1,'info','tarea',3,'actualizar','2025-05-26 11:48:51','2025-05-26 11:53:43'),(23,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-27 01:02:18',1,'info','tarea',3,'actualizar','2025-05-27 01:02:18','2025-05-27 01:03:01'),(24,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-27 03:08:42',1,'info','tarea',3,'actualizar','2025-05-27 03:08:42','2025-05-27 06:14:33'),(25,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-27 03:08:43',1,'info','tarea',3,'actualizar','2025-05-27 03:08:43','2025-05-27 06:14:33'),(26,2,'Nueva cita: Extracción dental simple con Dr. Julio Guardado el 29/05/2025, 12:05','2025-05-27 05:46:10',1,'info','cita',1,'crear','2025-05-27 05:46:10','2025-05-27 06:14:33'),(27,2,'Nueva cita: Extracción dental simple con Julio Guardado el 29/05/2025, 12:05','2025-05-27 05:46:10',1,'info','cita',1,'crear','2025-05-27 05:46:10','2025-05-27 06:14:33'),(28,2,'Nueva cita: Ortodoncia - Consulta inicial con Dr. Administrador el 30/05/2025, 12:15','2025-05-27 05:47:23',1,'info','cita',2,'crear','2025-05-27 05:47:23','2025-05-27 06:14:33'),(29,1,'Nueva cita: Ortodoncia - Consulta inicial con Julio Guardado el 30/05/2025, 12:15','2025-05-27 05:47:23',0,'info','cita',2,'crear','2025-05-27 05:47:23','2025-05-27 05:47:23'),(30,2,'Nueva cita: Extracción dental simple con Dr. Julio Guardado el 28/05/2025, 12:10','2025-05-27 06:05:37',1,'info','cita',3,'crear','2025-05-27 06:05:37','2025-05-27 06:14:33'),(31,2,'Nueva cita: Extracción dental simple con Julio Guardado el 28/05/2025, 12:10','2025-05-27 06:05:37',1,'info','cita',3,'crear','2025-05-27 06:05:37','2025-05-27 06:14:33'),(32,2,'Nueva tarea asignada: dasda (Fecha límite: 31/5/2025)','2025-05-27 23:08:14',1,'alerta','tarea',4,'crear','2025-05-27 23:08:14','2025-05-27 23:08:23'),(33,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-27 23:08:16',1,'info','tarea',3,'actualizar','2025-05-27 23:08:16','2025-05-27 23:08:28'),(34,2,'Tarea marcada como completada: dasda','2025-05-27 23:08:17',1,'info','tarea',4,'completar','2025-05-27 23:08:17','2025-05-27 23:08:20'),(35,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-27 23:08:30',1,'info','tarea',3,'actualizar','2025-05-27 23:08:30','2025-05-27 23:10:49'),(36,2,'Tarea modificada: dasda (Fecha límite: 31/5/2025)','2025-05-27 23:08:31',1,'info','tarea',4,'actualizar','2025-05-27 23:08:31','2025-05-27 23:10:49'),(37,2,'Tarea marcada como completada: dasda','2025-05-27 23:08:33',1,'info','tarea',4,'completar','2025-05-27 23:08:33','2025-05-27 23:10:49'),(38,2,'Tarea modificada: dasda (Fecha límite: 31/5/2025)','2025-05-27 23:08:35',1,'info','tarea',4,'actualizar','2025-05-27 23:08:35','2025-05-27 23:10:49'),(39,2,'Tarea marcada como completada: dasda','2025-05-27 23:08:38',1,'info','tarea',4,'completar','2025-05-27 23:08:38','2025-05-27 23:10:49'),(40,2,'Tarea modificada: dasda (Fecha límite: 31/5/2025)','2025-05-27 23:08:47',1,'info','tarea',4,'actualizar','2025-05-27 23:08:47','2025-05-27 23:10:49'),(41,2,'Tarea marcada como completada: dasda','2025-05-27 23:08:50',1,'info','tarea',4,'completar','2025-05-27 23:08:50','2025-05-27 23:10:49'),(42,2,'Tarea modificada: dasda (Fecha límite: 31/5/2025)','2025-05-27 23:56:22',1,'info','tarea',4,'actualizar','2025-05-27 23:56:22','2025-05-27 23:58:10'),(43,2,'Tarea marcada como completada: dasda','2025-05-27 23:58:33',1,'info','tarea',4,'completar','2025-05-27 23:58:33','2025-05-27 23:58:38'),(44,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-28 02:13:43',1,'info','tarea',3,'actualizar','2025-05-28 02:13:43','2025-05-28 02:13:56'),(45,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-28 02:13:59',1,'info','tarea',3,'actualizar','2025-05-28 02:13:59','2025-05-28 03:26:35'),(46,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-28 02:14:00',1,'info','tarea',3,'actualizar','2025-05-28 02:14:00','2025-05-28 03:26:35'),(47,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-28 02:14:01',1,'info','tarea',3,'actualizar','2025-05-28 02:14:01','2025-05-28 03:26:35'),(48,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-28 02:14:02',1,'info','tarea',3,'actualizar','2025-05-28 02:14:02','2025-05-28 03:26:35'),(49,2,'Tarea marcada como completada: casdfas','2025-05-28 04:13:44',1,'info','tarea',3,'completar','2025-05-28 04:13:44','2025-05-28 06:46:31'),(50,2,'Tarea modificada: dasda (Fecha límite: 31/5/2025)','2025-05-28 04:13:48',1,'info','tarea',4,'actualizar','2025-05-28 04:13:48','2025-05-28 06:46:31'),(51,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-28 04:13:49',1,'info','tarea',3,'actualizar','2025-05-28 04:13:49','2025-05-28 06:46:31'),(52,2,'Tarea modificada: dasda (Fecha límite: 31/5/2025)','2025-05-28 05:31:46',1,'info','tarea',4,'actualizar','2025-05-28 05:31:46','2025-05-28 06:46:31'),(53,2,'Tarea marcada como completada: dasda','2025-05-28 05:31:49',1,'info','tarea',4,'completar','2025-05-28 05:31:49','2025-05-28 06:46:31'),(54,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-28 05:34:04',1,'info','tarea',3,'actualizar','2025-05-28 05:34:04','2025-05-28 06:46:31'),(55,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-28 05:34:07',1,'info','tarea',3,'actualizar','2025-05-28 05:34:07','2025-05-28 06:46:31'),(56,2,'Cita modificada: Ortodoncia - Consulta inicial ahora confirmada el 30/05/2025, 12:15','2025-05-28 07:02:01',1,'info','cita',2,'actualizar','2025-05-28 07:02:01','2025-05-28 07:59:47'),(57,1,'Cita modificada: Ortodoncia - Consulta inicial con Dentista ahora confirmada el 30/05/2025, 12:15','2025-05-28 07:02:01',0,'info','cita',2,'actualizar','2025-05-28 07:02:01','2025-05-28 07:02:01'),(58,2,'Nueva cita: Ortodoncia - Consulta inicial con Dr. Administrador el 28/05/2025, 09:30','2025-05-28 07:24:37',1,'info','cita',4,'crear','2025-05-28 07:24:37','2025-05-28 07:59:47'),(59,1,'Nueva cita: Ortodoncia - Consulta inicial con Dentista el 28/05/2025, 09:30','2025-05-28 07:24:37',0,'info','cita',4,'crear','2025-05-28 07:24:37','2025-05-28 07:24:37'),(60,2,'Nueva cita: Blanqueamiento dental con Dr. Dentista el 04/06/2025, 09:30','2025-05-28 07:50:25',1,'info','cita',5,'crear','2025-05-28 07:50:25','2025-05-28 07:59:47'),(61,2,'Nueva cita: Blanqueamiento dental con Dentista el 04/06/2025, 09:30','2025-05-28 07:50:25',1,'info','cita',5,'crear','2025-05-28 07:50:25','2025-05-28 07:59:47'),(62,2,'Nueva cita: Empaste dental con Dr. Administrador el 30/05/2025, 13:00','2025-05-28 07:59:24',1,'info','cita',6,'crear','2025-05-28 07:59:24','2025-05-28 07:59:47'),(63,1,'Nueva cita: Empaste dental con Dentista el 30/05/2025, 13:00','2025-05-28 07:59:24',0,'info','cita',6,'crear','2025-05-28 07:59:24','2025-05-28 07:59:24'),(64,2,'Nueva cita: Blanqueamiento dental con Dr. Administrador el 30/05/2025, 09:00','2025-05-28 08:05:40',1,'info','cita',7,'crear','2025-05-28 08:05:40','2025-05-28 15:31:04'),(65,1,'Nueva cita: Blanqueamiento dental con Dentista el 30/05/2025, 09:00','2025-05-28 08:05:40',0,'info','cita',7,'crear','2025-05-28 08:05:40','2025-05-28 08:05:40'),(66,2,'Cita modificada: Blanqueamiento dental ahora pendiente el 30/05/2025, 10:00','2025-05-28 08:05:50',1,'info','cita',7,'actualizar','2025-05-28 08:05:50','2025-05-28 15:31:04'),(67,1,'Cita modificada: Blanqueamiento dental con Dentista ahora pendiente el 30/05/2025, 10:00','2025-05-28 08:05:50',0,'info','cita',7,'actualizar','2025-05-28 08:05:50','2025-05-28 08:05:50'),(68,2,'Cita modificada: Blanqueamiento dental ahora pendiente el 29/05/2025, 10:00','2025-05-28 08:05:55',1,'info','cita',7,'actualizar','2025-05-28 08:05:55','2025-05-28 15:31:04'),(69,1,'Cita modificada: Blanqueamiento dental con Dentista ahora pendiente el 29/05/2025, 10:00','2025-05-28 08:05:55',0,'info','cita',7,'actualizar','2025-05-28 08:05:55','2025-05-28 08:05:55'),(70,2,'Cita modificada: Blanqueamiento dental ahora pendiente el 30/05/2025, 10:00','2025-05-28 08:05:55',1,'info','cita',7,'actualizar','2025-05-28 08:05:55','2025-05-28 15:31:04'),(71,1,'Cita modificada: Blanqueamiento dental con Dentista ahora pendiente el 30/05/2025, 10:00','2025-05-28 08:05:55',0,'info','cita',7,'actualizar','2025-05-28 08:05:55','2025-05-28 08:05:55'),(72,2,'Cita modificada: Blanqueamiento dental ahora pendiente el 31/05/2025, 10:00','2025-05-28 08:05:58',1,'info','cita',7,'actualizar','2025-05-28 08:05:58','2025-05-28 15:31:04'),(73,1,'Cita modificada: Blanqueamiento dental con Dentista ahora pendiente el 31/05/2025, 10:00','2025-05-28 08:05:58',0,'info','cita',7,'actualizar','2025-05-28 08:05:58','2025-05-28 08:05:58'),(74,2,'Cita modificada: Blanqueamiento dental ahora pendiente el 30/05/2025, 10:00','2025-05-28 08:05:59',1,'info','cita',7,'actualizar','2025-05-28 08:05:59','2025-05-28 15:31:04'),(75,1,'Cita modificada: Blanqueamiento dental con Dentista ahora pendiente el 30/05/2025, 10:00','2025-05-28 08:05:59',0,'info','cita',7,'actualizar','2025-05-28 08:05:59','2025-05-28 08:05:59'),(76,2,'Cita modificada: Blanqueamiento dental ahora pendiente el 30/05/2025, 10:30','2025-05-28 08:06:35',1,'info','cita',7,'actualizar','2025-05-28 08:06:35','2025-05-28 15:31:04'),(77,1,'Cita modificada: Blanqueamiento dental con Dentista ahora pendiente el 30/05/2025, 10:30','2025-05-28 08:06:35',0,'info','cita',7,'actualizar','2025-05-28 08:06:35','2025-05-28 08:06:35'),(78,2,'Cita modificada: Blanqueamiento dental ahora pendiente el 30/05/2025, 09:30','2025-05-28 08:06:39',1,'info','cita',7,'actualizar','2025-05-28 08:06:39','2025-05-28 15:31:04'),(79,1,'Cita modificada: Blanqueamiento dental con Dentista ahora pendiente el 30/05/2025, 09:30','2025-05-28 08:06:39',0,'info','cita',7,'actualizar','2025-05-28 08:06:39','2025-05-28 08:06:39'),(80,2,'Tarea modificada: dasda (Fecha límite: 31/5/2025)','2025-05-28 08:11:13',1,'info','tarea',4,'actualizar','2025-05-28 08:11:13','2025-05-28 15:31:04'),(81,2,'Tarea modificada: dasda (Fecha límite: 31/5/2025)','2025-05-28 08:11:14',1,'info','tarea',4,'actualizar','2025-05-28 08:11:14','2025-05-28 15:31:04'),(82,2,'Cita modificada: Blanqueamiento dental ahora pendiente el 30/05/2025, 10:15','2025-05-28 08:14:13',1,'info','cita',7,'actualizar','2025-05-28 08:14:13','2025-05-28 15:31:04'),(83,1,'Cita modificada: Blanqueamiento dental con cliente 2 ahora pendiente el 30/05/2025, 10:15','2025-05-28 08:14:13',0,'info','cita',7,'actualizar','2025-05-28 08:14:13','2025-05-28 08:14:13'),(84,2,'Cita modificada: Ortodoncia - Consulta inicial ahora pendiente el 28/05/2025, 10:15','2025-05-28 08:19:58',1,'info','cita',4,'actualizar','2025-05-28 08:19:58','2025-05-28 15:31:04'),(85,1,'Cita modificada: Ortodoncia - Consulta inicial con cliente 2 ahora pendiente el 28/05/2025, 10:15','2025-05-28 08:19:58',0,'info','cita',4,'actualizar','2025-05-28 08:19:58','2025-05-28 08:19:58'),(86,2,'Cita modificada: Ortodoncia - Consulta inicial ahora pendiente el 28/05/2025, 10:30','2025-05-28 08:19:59',1,'info','cita',4,'actualizar','2025-05-28 08:19:59','2025-05-28 15:31:04'),(87,1,'Cita modificada: Ortodoncia - Consulta inicial con cliente 2 ahora pendiente el 28/05/2025, 10:30','2025-05-28 08:19:59',0,'info','cita',4,'actualizar','2025-05-28 08:19:59','2025-05-28 08:19:59'),(88,2,'Cita modificada: Ortodoncia - Consulta inicial ahora pendiente el 28/05/2025, 10:45','2025-05-28 08:20:00',1,'info','cita',4,'actualizar','2025-05-28 08:20:00','2025-05-28 15:31:04'),(89,1,'Cita modificada: Ortodoncia - Consulta inicial con cliente 2 ahora pendiente el 28/05/2025, 10:45','2025-05-28 08:20:00',0,'info','cita',4,'actualizar','2025-05-28 08:20:00','2025-05-28 08:20:00'),(90,2,'Cita modificada: Ortodoncia - Consulta inicial ahora pendiente el 28/05/2025, 10:30','2025-05-28 08:20:15',1,'info','cita',4,'actualizar','2025-05-28 08:20:15','2025-05-28 15:31:04'),(91,1,'Cita modificada: Ortodoncia - Consulta inicial con cliente 2 ahora pendiente el 28/05/2025, 10:30','2025-05-28 08:20:15',0,'info','cita',4,'actualizar','2025-05-28 08:20:15','2025-05-28 08:20:15'),(92,2,'Cita modificada: Ortodoncia - Consulta inicial ahora pendiente el 28/05/2025, 10:00','2025-05-28 08:20:16',1,'info','cita',4,'actualizar','2025-05-28 08:20:16','2025-05-28 15:31:04'),(93,1,'Cita modificada: Ortodoncia - Consulta inicial con cliente 2 ahora pendiente el 28/05/2025, 10:00','2025-05-28 08:20:16',0,'info','cita',4,'actualizar','2025-05-28 08:20:16','2025-05-28 08:20:16'),(94,2,'Cita modificada: Ortodoncia - Consulta inicial ahora pendiente el 28/05/2025, 09:30','2025-05-28 08:20:17',1,'info','cita',4,'actualizar','2025-05-28 08:20:17','2025-05-28 15:31:04'),(95,1,'Cita modificada: Ortodoncia - Consulta inicial con cliente 2 ahora pendiente el 28/05/2025, 09:30','2025-05-28 08:20:17',0,'info','cita',4,'actualizar','2025-05-28 08:20:17','2025-05-28 08:20:17'),(96,2,'Cita modificada: Ortodoncia - Consulta inicial ahora pendiente el 28/05/2025, 09:00','2025-05-28 08:20:17',1,'info','cita',4,'actualizar','2025-05-28 08:20:17','2025-05-28 15:31:04'),(97,1,'Cita modificada: Ortodoncia - Consulta inicial con cliente 2 ahora pendiente el 28/05/2025, 09:00','2025-05-28 08:20:17',0,'info','cita',4,'actualizar','2025-05-28 08:20:17','2025-05-28 08:20:17'),(98,2,'Cita modificada: Blanqueamiento dental ahora pendiente el 28/05/2025, 10:15','2025-05-28 08:20:18',1,'info','cita',5,'actualizar','2025-05-28 08:20:18','2025-05-28 15:31:04'),(99,2,'Cita modificada: Blanqueamiento dental con cliente 2 ahora pendiente el 28/05/2025, 10:15','2025-05-28 08:20:18',1,'info','cita',5,'actualizar','2025-05-28 08:20:18','2025-05-28 15:31:04'),(100,2,'Cita modificada: Ortodoncia - Consulta inicial ahora pendiente el 28/05/2025, 09:45','2025-05-28 08:20:21',1,'info','cita',4,'actualizar','2025-05-28 08:20:21','2025-05-28 15:31:04'),(101,1,'Cita modificada: Ortodoncia - Consulta inicial con cliente 2 ahora pendiente el 28/05/2025, 09:45','2025-05-28 08:20:21',0,'info','cita',4,'actualizar','2025-05-28 08:20:21','2025-05-28 08:20:21'),(102,2,'Cita modificada: Blanqueamiento dental ahora pendiente el 28/05/2025, 09:30','2025-05-28 08:20:22',1,'info','cita',5,'actualizar','2025-05-28 08:20:22','2025-05-28 15:31:04'),(103,2,'Cita modificada: Blanqueamiento dental con cliente 2 ahora pendiente el 28/05/2025, 09:30','2025-05-28 08:20:22',1,'info','cita',5,'actualizar','2025-05-28 08:20:22','2025-05-28 15:31:04'),(104,2,'Cita modificada: Ortodoncia - Consulta inicial ahora pendiente el 28/05/2025, 09:15','2025-05-28 08:20:23',1,'info','cita',4,'actualizar','2025-05-28 08:20:23','2025-05-28 15:31:04'),(105,1,'Cita modificada: Ortodoncia - Consulta inicial con cliente 2 ahora pendiente el 28/05/2025, 09:15','2025-05-28 08:20:23',0,'info','cita',4,'actualizar','2025-05-28 08:20:23','2025-05-28 08:20:23'),(106,2,'Cita modificada: Blanqueamiento dental ahora pendiente el 28/05/2025, 10:00','2025-05-28 08:20:25',1,'info','cita',5,'actualizar','2025-05-28 08:20:25','2025-05-28 15:31:04'),(107,2,'Cita modificada: Blanqueamiento dental con cliente 2 ahora pendiente el 28/05/2025, 10:00','2025-05-28 08:20:25',1,'info','cita',5,'actualizar','2025-05-28 08:20:25','2025-05-28 15:31:04'),(108,2,'Cita modificada: Blanqueamiento dental ahora pendiente el 28/05/2025, 10:30','2025-05-28 08:20:28',1,'info','cita',5,'actualizar','2025-05-28 08:20:28','2025-05-28 15:31:04'),(109,2,'Cita modificada: Blanqueamiento dental con cliente 2 ahora pendiente el 28/05/2025, 10:30','2025-05-28 08:20:28',1,'info','cita',5,'actualizar','2025-05-28 08:20:28','2025-05-28 15:31:04'),(110,2,'Tarea modificada: dasda (Fecha límite: 31/5/2025)','2025-05-28 08:22:07',1,'info','tarea',4,'actualizar','2025-05-28 08:22:07','2025-05-28 15:31:04'),(111,2,'Tarea marcada como completada: dasda','2025-05-28 15:32:13',1,'info','tarea',4,'completar','2025-05-28 15:32:13','2025-05-28 16:12:16'),(112,2,'Cita modificada: Empaste dental ahora pendiente el 30/05/2025, 13:30','2025-05-28 15:54:01',1,'info','cita',6,'actualizar','2025-05-28 15:54:01','2025-05-28 16:12:16'),(113,1,'Cita modificada: Empaste dental con cliente 22 ahora pendiente el 30/05/2025, 13:30','2025-05-28 15:54:01',0,'info','cita',6,'actualizar','2025-05-28 15:54:01','2025-05-28 15:54:01'),(114,2,'Cita modificada: Ortodoncia - Consulta inicial ahora confirmada el 30/05/2025, 12:00','2025-05-28 15:54:02',1,'info','cita',2,'actualizar','2025-05-28 15:54:02','2025-05-28 16:12:16'),(115,1,'Cita modificada: Ortodoncia - Consulta inicial con cliente 22 ahora confirmada el 30/05/2025, 12:00','2025-05-28 15:54:02',0,'info','cita',2,'actualizar','2025-05-28 15:54:02','2025-05-28 15:54:02'),(116,2,'Cita modificada: Extracción dental simple ahora pendiente el 28/05/2025, 11:05','2025-05-28 16:38:08',1,'info','cita',1,'actualizar','2025-05-28 16:38:08','2025-05-28 19:48:31'),(117,2,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 28/05/2025, 11:05','2025-05-28 16:38:08',1,'info','cita',1,'actualizar','2025-05-28 16:38:08','2025-05-28 19:48:31'),(118,2,'Cita modificada: Extracción dental simple ahora pendiente el 28/05/2025, 11:35','2025-05-28 16:39:56',1,'info','cita',1,'actualizar','2025-05-28 16:39:56','2025-05-28 19:48:31'),(119,2,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 28/05/2025, 11:35','2025-05-28 16:39:56',1,'info','cita',1,'actualizar','2025-05-28 16:39:56','2025-05-28 19:48:31'),(120,2,'Nueva cita: Extracción dental simple con Dr. Administrador el 29/05/2025, 09:00','2025-05-28 16:45:01',1,'info','cita',8,'crear','2025-05-28 16:45:01','2025-05-28 19:48:31'),(121,1,'Nueva cita: Extracción dental simple con cliente 22 el 29/05/2025, 09:00','2025-05-28 16:45:01',0,'info','cita',8,'crear','2025-05-28 16:45:01','2025-05-28 16:45:01'),(122,2,'Nueva cita: Extracción dental simple con Dr. Administrador el 28/05/2025, 12:00','2025-05-28 16:47:09',1,'info','cita',9,'crear','2025-05-28 16:47:09','2025-05-28 19:48:31'),(123,1,'Nueva cita: Extracción dental simple con cliente 22 el 28/05/2025, 12:00','2025-05-28 16:47:09',0,'info','cita',9,'crear','2025-05-28 16:47:09','2025-05-28 16:47:09'),(124,2,'Cita modificada: Extracción dental simple ahora pendiente el 28/05/2025, 11:15','2025-05-28 16:47:15',1,'info','cita',9,'actualizar','2025-05-28 16:47:15','2025-05-28 19:48:31'),(125,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 28/05/2025, 11:15','2025-05-28 16:47:15',0,'info','cita',9,'actualizar','2025-05-28 16:47:15','2025-05-28 16:47:15'),(126,2,'Cita modificada: Extracción dental simple ahora pendiente el 28/05/2025, 11:45','2025-05-28 16:47:24',1,'info','cita',9,'actualizar','2025-05-28 16:47:24','2025-05-28 19:48:31'),(127,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 28/05/2025, 11:45','2025-05-28 16:47:24',0,'info','cita',9,'actualizar','2025-05-28 16:47:24','2025-05-28 16:47:24'),(128,2,'Cita modificada: Extracción dental simple ahora pendiente el 28/05/2025, 11:00','2025-05-28 16:47:29',1,'info','cita',9,'actualizar','2025-05-28 16:47:29','2025-05-28 19:48:31'),(129,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 28/05/2025, 11:00','2025-05-28 16:47:29',0,'info','cita',9,'actualizar','2025-05-28 16:47:29','2025-05-28 16:47:29'),(130,2,'Cita modificada: Extracción dental simple ahora pendiente el 28/05/2025, 10:45','2025-05-28 16:47:30',1,'info','cita',9,'actualizar','2025-05-28 16:47:30','2025-05-28 19:48:31'),(131,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 28/05/2025, 10:45','2025-05-28 16:47:30',0,'info','cita',9,'actualizar','2025-05-28 16:47:30','2025-05-28 16:47:30'),(132,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 10:45','2025-05-28 16:47:33',1,'info','cita',9,'actualizar','2025-05-28 16:47:33','2025-05-28 19:48:31'),(133,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 10:45','2025-05-28 16:47:33',0,'info','cita',9,'actualizar','2025-05-28 16:47:33','2025-05-28 16:47:33'),(134,2,'Cita modificada: Extracción dental simple ahora pendiente el 30/05/2025, 10:45','2025-05-28 16:47:34',1,'info','cita',9,'actualizar','2025-05-28 16:47:34','2025-05-28 19:48:31'),(135,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 30/05/2025, 10:45','2025-05-28 16:47:34',0,'info','cita',9,'actualizar','2025-05-28 16:47:34','2025-05-28 16:47:34'),(136,2,'Cita modificada: Extracción dental simple ahora pendiente el 31/05/2025, 10:45','2025-05-28 16:47:35',1,'info','cita',9,'actualizar','2025-05-28 16:47:35','2025-05-28 19:48:31'),(137,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 31/05/2025, 10:45','2025-05-28 16:47:35',0,'info','cita',9,'actualizar','2025-05-28 16:47:35','2025-05-28 16:47:35'),(138,2,'Cita modificada: Extracción dental simple ahora pendiente el 01/06/2025, 10:45','2025-05-28 16:47:35',1,'info','cita',9,'actualizar','2025-05-28 16:47:35','2025-05-28 19:48:31'),(139,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 01/06/2025, 10:45','2025-05-28 16:47:35',0,'info','cita',9,'actualizar','2025-05-28 16:47:35','2025-05-28 16:47:35'),(140,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:39:40',1,'info','cita',8,'actualizar','2025-05-28 19:39:40','2025-05-28 19:48:31'),(141,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:39:40',0,'info','cita',8,'actualizar','2025-05-28 19:39:40','2025-05-28 19:39:40'),(142,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:15',1,'info','cita',8,'actualizar','2025-05-28 19:40:15','2025-05-28 19:48:31'),(143,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:15',0,'info','cita',8,'actualizar','2025-05-28 19:40:15','2025-05-28 19:40:15'),(144,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:17',1,'info','cita',8,'actualizar','2025-05-28 19:40:17','2025-05-28 19:48:31'),(145,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:17',0,'info','cita',8,'actualizar','2025-05-28 19:40:17','2025-05-28 19:40:17'),(146,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:20',1,'info','cita',8,'actualizar','2025-05-28 19:40:20','2025-05-28 19:48:31'),(147,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:20',0,'info','cita',8,'actualizar','2025-05-28 19:40:20','2025-05-28 19:40:20'),(148,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:21',1,'info','cita',8,'actualizar','2025-05-28 19:40:21','2025-05-28 19:48:31'),(149,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:21',0,'info','cita',8,'actualizar','2025-05-28 19:40:21','2025-05-28 19:40:21'),(150,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:22',1,'info','cita',8,'actualizar','2025-05-28 19:40:22','2025-05-28 19:48:31'),(151,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:22',0,'info','cita',8,'actualizar','2025-05-28 19:40:22','2025-05-28 19:40:22'),(152,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:23',1,'info','cita',8,'actualizar','2025-05-28 19:40:23','2025-05-28 19:48:31'),(153,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:23',0,'info','cita',8,'actualizar','2025-05-28 19:40:23','2025-05-28 19:40:23'),(154,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:25',1,'info','cita',8,'actualizar','2025-05-28 19:40:25','2025-05-28 19:48:31'),(155,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 09:00','2025-05-28 19:40:25',0,'info','cita',8,'actualizar','2025-05-28 19:40:25','2025-05-28 19:40:25'),(156,2,'Cita modificada: Extracción dental simple ahora pendiente el 31/05/2025, 10:45','2025-05-28 19:44:50',1,'info','cita',9,'actualizar','2025-05-28 19:44:50','2025-05-28 19:48:31'),(157,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 31/05/2025, 10:45','2025-05-28 19:44:50',0,'info','cita',9,'actualizar','2025-05-28 19:44:50','2025-05-28 19:44:50'),(158,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 11:00','2025-05-28 19:44:51',1,'info','cita',9,'actualizar','2025-05-28 19:44:51','2025-05-28 19:48:31'),(159,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 11:00','2025-05-28 19:44:51',0,'info','cita',9,'actualizar','2025-05-28 19:44:51','2025-05-28 19:44:51'),(160,2,'Cita modificada: Extracción dental simple ahora pendiente el 30/05/2025, 10:45','2025-05-28 19:44:54',1,'info','cita',9,'actualizar','2025-05-28 19:44:54','2025-05-28 19:48:31'),(161,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 30/05/2025, 10:45','2025-05-28 19:44:54',0,'info','cita',9,'actualizar','2025-05-28 19:44:54','2025-05-28 19:44:54'),(162,2,'Cita modificada: Extracción dental simple ahora pendiente el 30/05/2025, 09:45','2025-05-28 19:44:54',1,'info','cita',9,'actualizar','2025-05-28 19:44:54','2025-05-28 19:48:31'),(163,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 30/05/2025, 09:45','2025-05-28 19:44:54',0,'info','cita',9,'actualizar','2025-05-28 19:44:54','2025-05-28 19:44:54'),(164,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 10:15','2025-05-28 19:44:55',1,'info','cita',9,'actualizar','2025-05-28 19:44:55','2025-05-28 19:48:31'),(165,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 10:15','2025-05-28 19:44:55',0,'info','cita',9,'actualizar','2025-05-28 19:44:55','2025-05-28 19:44:55'),(166,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 11:45','2025-05-28 19:44:55',1,'info','cita',9,'actualizar','2025-05-28 19:44:55','2025-05-28 19:48:31'),(167,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 11:45','2025-05-28 19:44:55',0,'info','cita',9,'actualizar','2025-05-28 19:44:55','2025-05-28 19:44:55'),(168,2,'Cita modificada: Extracción dental simple ahora pendiente el 30/05/2025, 11:45','2025-05-28 19:44:56',1,'info','cita',9,'actualizar','2025-05-28 19:44:56','2025-05-28 19:48:31'),(169,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 30/05/2025, 11:45','2025-05-28 19:44:56',0,'info','cita',9,'actualizar','2025-05-28 19:44:56','2025-05-28 19:44:56'),(170,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 11:45','2025-05-28 19:44:57',1,'info','cita',9,'actualizar','2025-05-28 19:44:57','2025-05-28 19:48:31'),(171,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 11:45','2025-05-28 19:44:57',0,'info','cita',9,'actualizar','2025-05-28 19:44:57','2025-05-28 19:44:57'),(172,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 10:45','2025-05-28 19:44:57',1,'info','cita',9,'actualizar','2025-05-28 19:44:57','2025-05-28 19:48:31'),(173,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 10:45','2025-05-28 19:44:57',0,'info','cita',9,'actualizar','2025-05-28 19:44:57','2025-05-28 19:44:57'),(174,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 09:15','2025-05-28 19:48:01',1,'info','cita',8,'actualizar','2025-05-28 19:48:01','2025-05-28 19:48:31'),(175,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 09:15','2025-05-28 19:48:01',0,'info','cita',8,'actualizar','2025-05-28 19:48:01','2025-05-28 19:48:01'),(176,2,'Cita modificada: Extracción dental simple ahora pendiente el 30/05/2025, 09:15','2025-05-28 21:12:29',1,'info','cita',8,'actualizar','2025-05-28 21:12:29','2025-05-28 21:32:22'),(177,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 30/05/2025, 09:15','2025-05-28 21:12:29',0,'info','cita',8,'actualizar','2025-05-28 21:12:29','2025-05-28 21:12:29'),(178,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 09:15','2025-05-28 21:12:30',1,'info','cita',8,'actualizar','2025-05-28 21:12:30','2025-05-28 21:32:22'),(179,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 09:15','2025-05-28 21:12:30',0,'info','cita',8,'actualizar','2025-05-28 21:12:30','2025-05-28 21:12:30'),(180,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 10:45','2025-05-28 21:13:36',1,'info','cita',9,'actualizar','2025-05-28 21:13:36','2025-05-28 21:32:22'),(181,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 10:45','2025-05-28 21:13:36',0,'info','cita',9,'actualizar','2025-05-28 21:13:36','2025-05-28 21:13:36'),(182,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 10:45','2025-05-28 21:13:39',1,'info','cita',9,'actualizar','2025-05-28 21:13:39','2025-05-28 21:32:22'),(183,1,'Cita modificada: Extracción dental simple con cliente 22 ahora pendiente el 29/05/2025, 10:45','2025-05-28 21:13:39',0,'info','cita',9,'actualizar','2025-05-28 21:13:39','2025-05-28 21:13:39'),(184,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-28 21:57:28',1,'info','tarea',3,'actualizar','2025-05-28 21:57:28','2025-05-29 13:35:01'),(185,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-28 22:14:18',1,'info','tarea',3,'actualizar','2025-05-28 22:14:18','2025-05-29 13:35:01'),(186,2,'Tarea modificada: dasda (Fecha límite: 31/5/2025)','2025-05-28 22:14:19',1,'info','tarea',4,'actualizar','2025-05-28 22:14:19','2025-05-29 13:35:01'),(187,2,'Nueva cita: Empaste dental con Dr. Dentista el 29/05/2025, 16:00','2025-05-29 15:48:57',0,'info','cita',10,'crear','2025-05-29 15:48:57','2025-05-29 15:48:57'),(188,2,'Nueva cita: Empaste dental con Dentista el 29/05/2025, 16:00','2025-05-29 15:48:57',0,'info','cita',10,'crear','2025-05-29 15:48:57','2025-05-29 15:48:57'),(189,2,'Cita modificada: Empaste dental ahora pendiente el 29/05/2025, 16:45','2025-05-29 15:49:15',0,'info','cita',10,'actualizar','2025-05-29 15:49:15','2025-05-29 15:49:15'),(190,2,'Cita modificada: Empaste dental con Dentista ahora pendiente el 29/05/2025, 16:45','2025-05-29 15:49:15',0,'info','cita',10,'actualizar','2025-05-29 15:49:15','2025-05-29 15:49:15'),(191,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 17:50','2025-05-29 15:49:39',0,'info','cita',1,'actualizar','2025-05-29 15:49:39','2025-05-29 15:49:39'),(192,2,'Cita modificada: Extracción dental simple con Dentista ahora pendiente el 29/05/2025, 17:50','2025-05-29 15:49:39',0,'info','cita',1,'actualizar','2025-05-29 15:49:39','2025-05-29 15:49:39'),(193,2,'Tarea marcada como completada: casdfas','2025-05-29 16:21:27',0,'info','tarea',3,'completar','2025-05-29 16:21:27','2025-05-29 16:21:27'),(194,2,'Tarea modificada: dasda (Fecha límite: 31/5/2025)','2025-05-29 16:22:23',0,'info','tarea',4,'actualizar','2025-05-29 16:22:23','2025-05-29 16:22:23'),(195,2,'Cita modificada: Extracción dental simple ahora pendiente el 29/05/2025, 18:05','2025-05-29 16:42:05',0,'info','cita',1,'actualizar','2025-05-29 16:42:05','2025-05-29 16:42:05'),(196,2,'Cita modificada: Extracción dental simple con Dentista ahora pendiente el 29/05/2025, 18:05','2025-05-29 16:42:05',0,'info','cita',1,'actualizar','2025-05-29 16:42:05','2025-05-29 16:42:05'),(197,2,'Cita modificada: Empaste dental ahora pendiente el 29/05/2025, 16:45','2025-05-29 16:43:51',0,'info','cita',10,'actualizar','2025-05-29 16:43:51','2025-05-29 16:43:51'),(198,2,'Cita modificada: Empaste dental con Dentista ahora pendiente el 29/05/2025, 16:45','2025-05-29 16:43:51',0,'info','cita',10,'actualizar','2025-05-29 16:43:51','2025-05-29 16:43:51'),(199,2,'Cita modificada: Empaste dental ahora pendiente el 29/05/2025, 17:00','2025-05-29 21:08:33',0,'info','cita',10,'actualizar','2025-05-29 21:08:33','2025-05-29 21:08:33'),(200,2,'Cita modificada: Empaste dental con Dentista ahora pendiente el 29/05/2025, 17:00','2025-05-29 21:08:33',0,'info','cita',10,'actualizar','2025-05-29 21:08:33','2025-05-29 21:08:33');
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicios`
--

DROP TABLE IF EXISTS `servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `precio` decimal(10,2) NOT NULL,
  `duracion` int NOT NULL COMMENT 'Duración en minutos',
  `imagen` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `categoria` varchar(100) DEFAULT NULL,
  `codigoServicio` varchar(20) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigoServicio` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_2` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_3` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_4` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_5` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_6` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_7` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_8` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_9` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_10` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_11` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_12` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_13` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_14` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_15` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_16` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_17` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_18` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_19` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_20` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_21` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_22` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_23` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_24` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_25` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_26` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_27` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_28` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_29` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_30` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_31` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_32` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_33` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_34` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_35` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_36` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_37` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_38` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_39` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_40` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_41` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_42` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_43` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_44` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_45` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_46` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_47` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_48` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_49` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_50` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_51` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_52` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_53` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_54` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_55` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_56` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_57` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_58` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_59` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_60` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_61` (`codigoServicio`),
  UNIQUE KEY `codigoServicio_62` (`codigoServicio`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicios`
--

LOCK TABLES `servicios` WRITE;
/*!40000 ALTER TABLE `servicios` DISABLE KEYS */;
INSERT INTO `servicios` VALUES (1,'Limpieza dental','Limpieza profesional para remover placa y sarro',50.00,60,NULL,1,'Higiene','123123123','2025-05-20 23:14:25','2025-05-26 11:54:39'),(2,'Extracción dental simple','Extracción de dientes con anestesia local',70.00,45,NULL,1,'Extracción',NULL,'2025-05-20 23:14:25','2025-05-20 23:14:25'),(3,'Ortodoncia - Consulta inicial','Evaluación para tratamiento de ortodoncia',80.00,60,NULL,1,'Ortodoncia',NULL,'2025-05-20 23:14:25','2025-05-20 23:14:25'),(4,'Blanqueamiento dental','Tratamiento para aclarar el color de los dientes',150.00,90,NULL,1,'Estética',NULL,'2025-05-20 23:14:25','2025-05-20 23:14:25'),(5,'Empaste dental','Relleno de cavidades con material compuesto',60.00,45,NULL,1,'Restauración',NULL,'2025-05-20 23:14:25','2025-05-20 23:14:25');
/*!40000 ALTER TABLE `servicios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tareas`
--

DROP TABLE IF EXISTS `tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tareas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) NOT NULL,
  `descripcion` text,
  `asignadoA` int NOT NULL,
  `creadoPor` int NOT NULL,
  `fechaLimite` datetime DEFAULT NULL,
  `estado` enum('pendiente','en progreso','completada','cancelada') DEFAULT 'pendiente',
  `prioridad` enum('baja','media','alta','urgente') DEFAULT 'media',
  `completadoEn` datetime DEFAULT NULL,
  `recordatorioEnviado` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tarea_asignado` (`asignadoA`),
  KEY `idx_tarea_estado` (`estado`),
  KEY `idx_tarea_fecha_limite` (`fechaLimite`),
  KEY `creadoPor` (`creadoPor`),
  CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`asignadoA`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`creadoPor`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas`
--

LOCK TABLES `tareas` WRITE;
/*!40000 ALTER TABLE `tareas` DISABLE KEYS */;
INSERT INTO `tareas` VALUES (3,'casdfas','dasdasd',2,2,'2025-05-26 11:39:00','completada','media','2025-05-29 16:21:27',0,'2025-05-26 11:37:53','2025-05-29 16:21:27'),(4,'dasda','dasda',2,2,'2025-05-31 23:12:00','pendiente','urgente',NULL,0,'2025-05-27 23:08:14','2025-05-29 16:22:23');
/*!40000 ALTER TABLE `tareas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tratamientos`
--

DROP TABLE IF EXISTS `tratamientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tratamientos` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `clienteId` int NOT NULL,
  `dentistaId` int NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text,
  `fechaInicio` datetime NOT NULL,
  `fechaFin` datetime DEFAULT NULL,
  `estado` enum('activo','completado','cancelado') DEFAULT 'activo',
  `progreso` int DEFAULT '0',
  `sesionesTotales` int NOT NULL DEFAULT '1',
  `sesionesCompletadas` int DEFAULT '0',
  `notas` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `clienteId` (`clienteId`),
  KEY `dentistaId` (`dentistaId`),
  CONSTRAINT `tratamientos_ibfk_1` FOREIGN KEY (`clienteId`) REFERENCES `clientes` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `tratamientos_ibfk_2` FOREIGN KEY (`dentistaId`) REFERENCES `dentistas` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tratamientos`
--

LOCK TABLES `tratamientos` WRITE;
/*!40000 ALTER TABLE `tratamientos` DISABLE KEYS */;
/*!40000 ALTER TABLE `tratamientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_settings`
--

DROP TABLE IF EXISTS `user_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `theme` enum('light','dark') DEFAULT 'light',
  `language` varchar(5) DEFAULT 'es',
  `notificationEmail` tinyint(1) DEFAULT '1',
  `notificationApp` tinyint(1) DEFAULT '1',
  `notificationSMS` tinyint(1) DEFAULT '0',
  `avatar` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_settings`
--

LOCK TABLES `user_settings` WRITE;
/*!40000 ALTER TABLE `user_settings` DISABLE KEYS */;
INSERT INTO `user_settings` VALUES (1,2,'light','es',0,0,0,'/uploads/avatars/avatar-fdddd1e5-f12b-4192-9963-53c12c4b15dc.png','2025-05-26 02:04:02','2025-05-29 17:03:13');
/*!40000 ALTER TABLE `user_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','dentista','cliente') NOT NULL DEFAULT 'cliente',
  `telefono` varchar(20) DEFAULT NULL,
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `resetPasswordExpires` datetime DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `ultimoLogin` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador','admin@crmclinico.com','$2a$10$l.Xxd8jJr0wYdQoN97eJY.PaWxBm3JC5a0yQUpKQLMqjLFiKW8nia','admin','5555555555',NULL,NULL,1,NULL,'2025-05-20 23:14:25','2025-05-20 23:14:25'),(2,'Dentista','prueba@ejemplo.com','$2b$10$VYGjBqAqIqgF4Jej0Xyp/O6TXYKHEFzw1ygi3qOckSWrnit3jPceC','admin','12345678',NULL,NULL,1,'2025-05-29 16:27:26','2025-05-23 04:31:14','2025-05-29 21:07:46'),(3,'Julio','juliomix089@gmail.com','$2b$10$9QHHOAV7dfNGm9RgjxgeMusjK33CWCW/HxjhgQAmpS03CoEUffKIO','cliente','79591765','617r7kpxemvnu0isj1rsm','2025-05-28 06:37:18',1,NULL,'2025-05-27 23:11:15','2025-05-28 05:37:18'),(7,'Maynol','maynol@gmail.com','$2b$10$JvQbBGP4u4sS.S.y.f0ILeoiYfSWrI175piSppK1SsKDY4YwOtIie','cliente','12345678',NULL,NULL,1,NULL,'2025-05-29 17:10:19','2025-05-29 17:10:19'),(10,'Steve','steverafa@gmail.com','$2b$10$SGoof4hOIPs1DNffILPamOPzbOFnmyQ4w5JXC.4i5SRlKids9gqLm','dentista','12345678',NULL,NULL,1,NULL,'2025-05-29 21:16:03','2025-05-29 21:16:03'),(11,'Steve','Steve@gmail.com','$2b$10$6Oz4wo6qwxQHtOLcZkd3m.Zm8qEJPTn7HFtVQk1.o.qVdJ9/kOaQ.','dentista','12345678',NULL,NULL,1,NULL,'2025-05-29 21:19:20','2025-05-29 21:19:20'),(12,'Test Dentista','testdentista@example.com','$2b$10$gk8WWcZk0Lipfv9LqvVeS.IvTIcb8agJEoKhb2QLiBWR/B7Nsna1G','dentista','12345678',NULL,NULL,1,NULL,'2025-05-29 21:20:29','2025-05-29 21:20:29'),(13,'Test Dentista 2','testdentista2@example.com','$2b$10$EkFWdL44P1fc.s0YGEdis.zoMy/XVvk5bn5wT.S8zBlu0iRjMk8.e','dentista','12345678',NULL,NULL,1,NULL,'2025-05-29 21:21:07','2025-05-29 21:21:07');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-29 16:27:26
