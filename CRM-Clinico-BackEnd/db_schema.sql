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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citas`
--

LOCK TABLES `citas` WRITE;
/*!40000 ALTER TABLE `citas` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,2,'cliente 2','guardado','portillo@gmail.com','12345678','{\"alergias\": \"asd\", \"cirugiasPrevias\": \"asd\", \"enfermedadesCronicas\": \"asd\", \"medicamentosActuales\": \"asd\"}',NULL,'2025-05-26 04:41:02','2025-05-15','masculino','dasda',NULL,NULL,'dsadasd',NULL,'{\"nombre\": \"asdasd\", \"relacion\": \"asdasd\", \"telefono\": \"asd\"}',NULL,NULL,NULL,'2025-05-26 04:41:02','2025-05-26 09:43:28'),(11,2,'Julio cliente','Guardado','juliomix089@gmail.com','79591765','{\"alergias\": \"asdasdasd\", \"cirugiasPrevias\": \"asdasd\", \"enfermedadesCronicas\": \"asda\", \"medicamentosActuales\": \"sdasdasd\"}',NULL,'2025-05-26 05:07:30','1966-05-25','no_especificado','Apopa',NULL,NULL,'asdasd',NULL,'{\"nombre\": \"asdasd\", \"relacion\": \"asdasd\", \"telefono\": \"68686868\"}','79591765',NULL,NULL,'2025-05-26 05:07:30','2025-05-26 05:07:30');
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
  `fotoPerfil` varchar(255) DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dentistas`
--

LOCK TABLES `dentistas` WRITE;
/*!40000 ALTER TABLE `dentistas` DISABLE KEYS */;
INSERT INTO `dentistas` VALUES (1,2,'Medico dentista','{\"lunes\": [{\"fin\": \"14:00\", \"inicio\": \"09:00\"}, {\"fin\": \"20:00\", \"inicio\": \"16:00\"}], \"jueves\": [{\"fin\": \"14:00\", \"inicio\": \"09:00\"}, {\"fin\": \"20:00\", \"inicio\": \"16:00\"}], \"martes\": [{\"fin\": \"14:00\", \"inicio\": \"09:00\"}, {\"fin\": \"20:00\", \"inicio\": \"16:00\"}], \"sabado\": [], \"domingo\": [], \"viernes\": [{\"fin\": \"14:00\", \"inicio\": \"09:00\"}], \"miercoles\": [{\"fin\": \"14:00\", \"inicio\": \"09:00\"}, {\"fin\": \"20:00\", \"inicio\": \"16:00\"}]}','activo','dasdasd','1233',4,'csdsad',NULL,'2025-05-26 07:33:01','2025-05-26 07:55:25'),(3,1,'dsadasd','{\"lunes\": [{\"fin\": \"14:00\", \"inicio\": \"09:00\"}], \"jueves\": [{\"fin\": \"14:00\", \"inicio\": \"09:00\"}], \"martes\": [{\"fin\": \"14:00\", \"inicio\": \"09:00\"}], \"viernes\": [{\"fin\": \"14:00\", \"inicio\": \"09:00\"}], \"miercoles\": [{\"fin\": \"14:00\", \"inicio\": \"09:00\"}]}','activo','Bachiller general diplomado en diseño gráfico','1233w332',3,'dasdasd',NULL,'2025-05-26 08:05:27','2025-05-26 08:05:27');
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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,2,'Nueva tarea asignada: dsadasd (Fecha límite: 26/5/2025)','2025-05-26 11:25:04',1,'info','tarea',1,'crear','2025-05-26 11:25:04','2025-05-26 11:47:41'),(2,2,'Tarea modificada: dsadasd (Fecha límite: 26/5/2025)','2025-05-26 11:27:08',1,'info','tarea',1,'actualizar','2025-05-26 11:27:08','2025-05-26 11:29:53'),(3,2,'Tarea modificada: dsadasd (Fecha límite: 26/5/2025)','2025-05-26 11:27:13',1,'info','tarea',1,'actualizar','2025-05-26 11:27:13','2025-05-26 11:29:54'),(4,2,'Nueva tarea asignada: dasdasd (Fecha límite: 26/5/2025)','2025-05-26 11:34:03',1,'info','tarea',2,'crear','2025-05-26 11:34:03','2025-05-26 11:46:22'),(5,2,'Tarea modificada: dasdasd (Fecha límite: 26/5/2025)','2025-05-26 11:34:08',1,'info','tarea',2,'actualizar','2025-05-26 11:34:08','2025-05-26 11:46:22'),(6,2,'Tarea modificada: dasdasd (Fecha límite: 26/5/2025)','2025-05-26 11:34:14',1,'info','tarea',2,'actualizar','2025-05-26 11:34:14','2025-05-26 11:46:22'),(7,2,'Nueva tarea asignada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:37:53',1,'info','tarea',3,'crear','2025-05-26 11:37:53','2025-05-26 11:46:22'),(8,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:40:54',1,'info','tarea',3,'actualizar','2025-05-26 11:40:54','2025-05-26 11:46:22'),(9,2,'Tarea marcada como completada: casdfas','2025-05-26 11:41:14',1,'info','tarea',3,'completar','2025-05-26 11:41:14','2025-05-26 11:46:22'),(10,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:43:28',1,'info','tarea',3,'actualizar','2025-05-26 11:43:28','2025-05-26 11:46:22'),(11,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:43:57',1,'info','tarea',3,'actualizar','2025-05-26 11:43:57','2025-05-26 11:46:22'),(12,2,'Tarea marcada como completada: casdfas','2025-05-26 11:43:59',1,'info','tarea',3,'completar','2025-05-26 11:43:59','2025-05-26 11:46:22'),(13,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:44:40',1,'info','tarea',3,'actualizar','2025-05-26 11:44:40','2025-05-26 11:46:16'),(14,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:44:40',1,'info','tarea',3,'actualizar','2025-05-26 11:44:40','2025-05-26 11:46:22'),(15,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:44:42',1,'info','tarea',3,'actualizar','2025-05-26 11:44:42','2025-05-26 11:46:14'),(16,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:44:44',1,'info','tarea',3,'actualizar','2025-05-26 11:44:44','2025-05-26 11:46:18'),(17,2,'Tarea marcada como completada: casdfas','2025-05-26 11:45:16',1,'info','tarea',3,'completar','2025-05-26 11:45:16','2025-05-26 11:46:22'),(18,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:45:17',1,'info','tarea',3,'actualizar','2025-05-26 11:45:17','2025-05-26 11:46:22'),(19,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:45:18',1,'info','tarea',3,'actualizar','2025-05-26 11:45:18','2025-05-26 11:46:22'),(20,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:48:48',1,'info','tarea',3,'actualizar','2025-05-26 11:48:48','2025-05-26 11:53:41'),(21,2,'Tarea marcada como completada: casdfas','2025-05-26 11:48:49',1,'info','tarea',3,'completar','2025-05-26 11:48:49','2025-05-26 11:53:40'),(22,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-26 11:48:51',1,'info','tarea',3,'actualizar','2025-05-26 11:48:51','2025-05-26 11:53:43'),(23,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-27 01:02:18',1,'info','tarea',3,'actualizar','2025-05-27 01:02:18','2025-05-27 01:03:01'),(24,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-27 03:08:42',0,'info','tarea',3,'actualizar','2025-05-27 03:08:42','2025-05-27 03:08:42'),(25,2,'Tarea modificada: casdfas (Fecha límite: 26/5/2025)','2025-05-27 03:08:43',0,'info','tarea',3,'actualizar','2025-05-27 03:08:43','2025-05-27 03:08:43');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas`
--

LOCK TABLES `tareas` WRITE;
/*!40000 ALTER TABLE `tareas` DISABLE KEYS */;
INSERT INTO `tareas` VALUES (3,'casdfas','dasdasd',2,2,'2025-05-26 11:39:00','pendiente','media',NULL,0,'2025-05-26 11:37:53','2025-05-27 03:08:43');
/*!40000 ALTER TABLE `tareas` ENABLE KEYS */;
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
INSERT INTO `user_settings` VALUES (1,2,'light','es',1,0,0,NULL,'2025-05-26 02:04:02','2025-05-26 02:24:23');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador','admin@crmclinico.com','$2a$10$l.Xxd8jJr0wYdQoN97eJY.PaWxBm3JC5a0yQUpKQLMqjLFiKW8nia','admin','5555555555',NULL,NULL,1,NULL,'2025-05-20 23:14:25','2025-05-20 23:14:25'),(2,'Julio Guardado','prueba@ejemplo.com','$2b$10$VYGjBqAqIqgF4Jej0Xyp/O6TXYKHEFzw1ygi3qOckSWrnit3jPceC','admin','70591765',NULL,NULL,1,'2025-05-27 02:13:17','2025-05-23 04:31:14','2025-05-27 02:13:17');
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

-- Dump completed on 2025-05-26 21:57:23
