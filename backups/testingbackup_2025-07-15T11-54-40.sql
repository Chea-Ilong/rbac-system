/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `week7db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `week7db`;
DROP TABLE IF EXISTS `AttendanceRecords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `AttendanceRecords` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'present',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `StudentId` int(11) DEFAULT NULL,
  `ClassId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `StudentId` (`StudentId`),
  KEY `ClassId` (`ClassId`),
  CONSTRAINT `AttendanceRecords_ibfk_1` FOREIGN KEY (`StudentId`) REFERENCES `Students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `AttendanceRecords_ibfk_2` FOREIGN KEY (`ClassId`) REFERENCES `Classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `AttendanceRecords` WRITE;
/*!40000 ALTER TABLE `AttendanceRecords` DISABLE KEYS */;
INSERT INTO `AttendanceRecords` VALUES
(1,'2025-06-26','present','2025-06-27 14:19:07','2025-06-27 14:19:07',1,1),
(2,'2025-06-26','present','2025-06-27 14:19:07','2025-06-27 14:27:48',2,1),
(3,'2025-06-26','present','2025-06-27 14:19:07','2025-06-27 14:19:07',3,2),
(4,'2025-06-27','present','2025-06-27 14:19:07','2025-06-27 14:19:07',1,1);
/*!40000 ALTER TABLE `AttendanceRecords` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Authors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Authors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `birthYear` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Authors` WRITE;
/*!40000 ALTER TABLE `Authors` DISABLE KEYS */;
INSERT INTO `Authors` VALUES
(1,'Ronan The Best',1990,'2025-06-27 08:36:11','2025-06-27 08:36:11'),
(2,'Kim Ang',1995,'2025-06-27 08:36:11','2025-06-27 08:36:11'),
(3,'Hok Tim',2015,'2025-06-27 08:36:11','2025-06-27 08:36:11');
/*!40000 ALTER TABLE `Authors` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Books` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `publicationYear` int(11) NOT NULL,
  `pages` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `AuthorId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `AuthorId` (`AuthorId`),
  CONSTRAINT `Books_ibfk_1` FOREIGN KEY (`AuthorId`) REFERENCES `Authors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Books` WRITE;
/*!40000 ALTER TABLE `Books` DISABLE KEYS */;
INSERT INTO `Books` VALUES
(1,'Sky Fire',2020,300,'2025-06-27 08:36:11','2025-06-27 08:36:11',1),
(2,'Ocean Deep',2021,250,'2025-06-27 08:36:11','2025-06-27 08:36:11',1),
(3,'Dream State',2019,200,'2025-06-27 08:36:11','2025-06-27 08:36:11',2),
(4,'Night Shift',2022,280,'2025-06-27 08:36:11','2025-06-27 08:36:11',2),
(5,'Tiny World',2023,150,'2025-06-27 08:36:11','2025-06-27 08:36:11',3),
(6,'Big Ideas',2024,100,'2025-06-27 08:36:11','2025-06-27 08:36:11',3),
(7,'Final Dawn',2025,310,'2025-06-27 08:36:11','2025-06-27 08:36:11',2);
/*!40000 ALTER TABLE `Books` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Classes` WRITE;
/*!40000 ALTER TABLE `Classes` DISABLE KEYS */;
INSERT INTO `Classes` VALUES
(1,'Math 101','2025-06-27 14:19:07','2025-06-27 14:19:07'),
(2,'Science 202','2025-06-27 14:19:07','2025-06-27 14:19:07');
/*!40000 ALTER TABLE `Classes` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `ClassId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ClassId` (`ClassId`),
  CONSTRAINT `Students_ibfk_1` FOREIGN KEY (`ClassId`) REFERENCES `Classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Students` WRITE;
/*!40000 ALTER TABLE `Students` DISABLE KEYS */;
INSERT INTO `Students` VALUES
(1,'Alice','2025-06-27 14:19:07','2025-06-27 14:19:07',1),
(2,'Bob','2025-06-27 14:19:07','2025-06-27 14:19:07',1),
(3,'Charlie','2025-06-27 14:19:07','2025-06-27 14:19:07',2);
/*!40000 ALTER TABLE `Students` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updateAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

