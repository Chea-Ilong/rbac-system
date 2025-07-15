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

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `PhsarDesign` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `PhsarDesign`;
DROP TABLE IF EXISTS `Applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Applications` (
  `application_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `freelancer_id` int(11) DEFAULT NULL,
  `client_id` int(11) DEFAULT NULL,
  `status` enum('accepted','pending','rejected') NOT NULL,
  `message` text DEFAULT NULL,
  `applied_for` datetime DEFAULT NULL,
  PRIMARY KEY (`application_id`),
  KEY `freelancer_id` (`freelancer_id`),
  KEY `client_id` (`client_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `Applications_ibfk_1` FOREIGN KEY (`freelancer_id`) REFERENCES `Freelancers_profile` (`freelancer_id`) ON DELETE SET NULL,
  CONSTRAINT `Applications_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `Clients_profile` (`client_id`) ON DELETE SET NULL,
  CONSTRAINT `Applications_ibfk_3` FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Applications` WRITE;
/*!40000 ALTER TABLE `Applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `Applications` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Clients_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Clients_profile` (
  `client_id` int(11) NOT NULL,
  `organization` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`client_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `Clients_profile_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Clients_profile` WRITE;
/*!40000 ALTER TABLE `Clients_profile` DISABLE KEYS */;
/*!40000 ALTER TABLE `Clients_profile` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Freelancers_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Freelancers_profile` (
  `freelancer_id` int(11) NOT NULL,
  `portfolio_images` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `availability` tinyint(1) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`freelancer_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `Freelancers_profile_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Freelancers_profile` WRITE;
/*!40000 ALTER TABLE `Freelancers_profile` DISABLE KEYS */;
/*!40000 ALTER TABLE `Freelancers_profile` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Messages` (
  `message_id` int(11) NOT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `receiver_id` int(11) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`message_id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `Messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `Users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `Messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `Users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Messages` WRITE;
/*!40000 ALTER TABLE `Messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `Messages` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Projects` (
  `project_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('open','in_progress','completed') DEFAULT NULL,
  `budget` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `client_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`project_id`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `Projects_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `Clients_profile` (`client_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Projects` WRITE;
/*!40000 ALTER TABLE `Projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `Projects` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `user_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('client','freelancer') NOT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `testing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `testing` (
  `NAME` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `testing` WRITE;
/*!40000 ALTER TABLE `testing` DISABLE KEYS */;
/*!40000 ALTER TABLE `testing` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

