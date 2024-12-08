-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 20, 2024 at 04:21 PM
-- Server version: 10.4.24-MariaDB
-- PHP Version: 8.1.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hivedb`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `admin_id` int(11) NOT NULL,
  `adminEmail` varchar(255) NOT NULL,
  `adminPassword` varchar(255) NOT NULL,
  `adminFirstName` varchar(200) NOT NULL,
  `adminLastName` varchar(200) NOT NULL,
  `establishment_id` int(11) NOT NULL,
  `adminProfile` varchar(255) DEFAULT NULL,
  `isVerified` tinyint(1) DEFAULT 0,
  `lastLogin` datetime DEFAULT current_timestamp(),
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `resetPasswordExpiresAt` datetime DEFAULT NULL,
  `verificationToken` varchar(255) DEFAULT NULL,
  `verificationTokenExpiresAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`admin_id`, `adminEmail`, `adminPassword`, `adminFirstName`, `adminLastName`, `establishment_id`, `adminProfile`, `isVerified`, `lastLogin`, `resetPasswordToken`, `resetPasswordExpiresAt`, `verificationToken`, `verificationTokenExpiresAt`) VALUES
(1, 'ellasimara02@gmail.com', '$2a$10$NJzopEp3pATWOXeS2LE60urSmBb5kAkmlZoHy1B8qbIqjIsVBXSbi', 'Daniella', 'Simara', 1, '3e57a0b247a2c9d13cd65e34cbcee697.jpg', 1, '2024-11-18 16:11:56', NULL, NULL, '491415', '2024-11-03 16:14:52');

-- --------------------------------------------------------

--
-- Table structure for table `calendars`
--

CREATE TABLE `calendars` (
  `event_id` int(11) NOT NULL,
  `event_name` varchar(255) NOT NULL,
  `start` datetime NOT NULL,
  `end` datetime DEFAULT NULL,
  `event_description` text DEFAULT NULL,
  `status` enum('Not Started','Working in Progress','On Hold','Done') NOT NULL DEFAULT 'Not Started',
  `admin_id` int(11) NOT NULL,
  `establishment_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `calendars`
--

INSERT INTO `calendars` (`event_id`, `event_name`, `start`, `end`, `event_description`, `status`, `admin_id`, `establishment_id`) VALUES
(3, 'Test', '2024-11-19 19:00:00', '2024-11-19 22:00:00', 'Test description', 'Not Started', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `establishments`
--

CREATE TABLE `establishments` (
  `establishment_id` int(11) NOT NULL,
  `eName` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `establishments`
--

INSERT INTO `establishments` (`establishment_id`, `eName`) VALUES
(1, 'Payne\'s Dormitory');

-- --------------------------------------------------------

--
-- Table structure for table `notices`
--

CREATE TABLE `notices` (
  `notice_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `pinned` tinyint(1) DEFAULT 0,
  `permanent` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `admin_id` int(11) NOT NULL,
  `establishment_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `notices`
--

INSERT INTO `notices` (`notice_id`, `title`, `content`, `pinned`, `permanent`, `created_at`, `updated_at`, `admin_id`, `establishment_id`) VALUES
(1, 'Test Title', 'Test Content', 0, 0, '2024-11-20 15:20:07', '2024-11-20 15:20:07', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `room_id` int(11) NOT NULL,
  `roomNumber` varchar(10) NOT NULL,
  `roomType` varchar(50) NOT NULL,
  `roomTotalSlot` int(11) NOT NULL,
  `roomRemainingSlot` int(11) NOT NULL,
  `establishment_id` int(11) NOT NULL,
  `floorNumber` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`room_id`, `roomNumber`, `roomType`, `roomTotalSlot`, `roomRemainingSlot`, `establishment_id`, `floorNumber`) VALUES
(1, '201', 'Female Studio Type', 4, 1, 1, 2),
(2, '204', 'Female Studio Type', 6, 4, 1, 2),
(5, '401', 'Dorm Type', 6, 6, 1, 4),
(7, '1', 'Dorm', 4, 4, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tenants`
--

CREATE TABLE `tenants` (
  `tenant_id` int(11) NOT NULL,
  `tenantFirstName` varchar(200) NOT NULL,
  `tenantLastName` varchar(200) NOT NULL,
  `tenantEmail` varchar(200) NOT NULL,
  `tenantPassword` varchar(255) NOT NULL,
  `gender` enum('M','F','Other') NOT NULL,
  `mobileNum` varchar(15) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL,
  `establishment_id` int(11) NOT NULL,
  `stayFrom` datetime DEFAULT NULL,
  `stayTo` datetime DEFAULT NULL,
  `periodRemaining` int(11) DEFAULT NULL,
  `status` enum('active','expired') NOT NULL DEFAULT 'active',
  `dateJoined` datetime DEFAULT current_timestamp(),
  `tenantGuardianName` varchar(200) DEFAULT NULL,
  `tenantAddress` varchar(255) DEFAULT NULL,
  `tenantGuardianNum` varchar(15) DEFAULT NULL,
  `tenantProfile` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tenants`
--

INSERT INTO `tenants` (`tenant_id`, `tenantFirstName`, `tenantLastName`, `tenantEmail`, `tenantPassword`, `gender`, `mobileNum`, `room_id`, `establishment_id`, `stayFrom`, `stayTo`, `periodRemaining`, `status`, `dateJoined`, `tenantGuardianName`, `tenantAddress`, `tenantGuardianNum`, `tenantProfile`) VALUES
(5, 'Test', 'Test', 'Test@gmail.com', '$2a$10$Mr7zJ8lZhO36lN2bwwAHfePPxT2nCUPPEYrLQnYrzwEn6sT9FoMzq', 'F', '01987654321', NULL, 1, '2024-11-08 00:00:00', '2024-11-30 00:00:00', NULL, 'active', '2024-11-07 15:33:58', NULL, NULL, NULL, NULL),
(8, 'Another', 'Test', 'test2@gmail.com', '$2a$10$DEtvK/3Qio/ksqFywvnaherH.MTvwH3Mg37qgTRD9tJTPDIZHb5Mu', 'Other', '01987654321', NULL, 1, NULL, NULL, NULL, 'active', '2024-11-09 09:32:53', NULL, NULL, NULL, NULL),
(17, 'Working', 'Test', 'workingtest@gmail.com', '$2a$10$NINyBD3YONmpLVT7nLXP6eL4YrsGBEBGSCglUjpc0u39vxYCYzjwi', 'M', '12345678910', 2, 1, '2024-11-18 00:00:00', '2025-01-31 00:00:00', NULL, 'active', '2024-11-14 14:26:36', NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `adminEmail` (`adminEmail`),
  ADD KEY `establishment_id` (`establishment_id`);

--
-- Indexes for table `calendars`
--
ALTER TABLE `calendars`
  ADD PRIMARY KEY (`event_id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `establishment_id` (`establishment_id`);

--
-- Indexes for table `establishments`
--
ALTER TABLE `establishments`
  ADD PRIMARY KEY (`establishment_id`),
  ADD UNIQUE KEY `eName` (`eName`);

--
-- Indexes for table `notices`
--
ALTER TABLE `notices`
  ADD PRIMARY KEY (`notice_id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `establishment_id` (`establishment_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`room_id`),
  ADD KEY `establishment_id` (`establishment_id`);

--
-- Indexes for table `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`tenant_id`),
  ADD UNIQUE KEY `tenantEmail` (`tenantEmail`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `establishment_id` (`establishment_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `calendars`
--
ALTER TABLE `calendars`
  MODIFY `event_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `establishments`
--
ALTER TABLE `establishments`
  MODIFY `establishment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notices`
--
ALTER TABLE `notices`
  MODIFY `notice_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tenants`
--
ALTER TABLE `tenants`
  MODIFY `tenant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admins`
--
ALTER TABLE `admins`
  ADD CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`establishment_id`) ON DELETE CASCADE;

--
-- Constraints for table `calendars`
--
ALTER TABLE `calendars`
  ADD CONSTRAINT `calendars_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `calendars_ibfk_2` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`establishment_id`) ON DELETE CASCADE;

--
-- Constraints for table `notices`
--
ALTER TABLE `notices`
  ADD CONSTRAINT `notices_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notices_ibfk_2` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`establishment_id`) ON DELETE CASCADE;

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`establishment_id`);

--
-- Constraints for table `tenants`
--
ALTER TABLE `tenants`
  ADD CONSTRAINT `tenants_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tenants_ibfk_2` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`establishment_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
