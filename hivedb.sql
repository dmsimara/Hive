-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 25, 2025 at 04:00 AM
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
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `activity_id` int(11) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `actionType` varchar(255) DEFAULT NULL,
  `actionDetails` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

-- --------------------------------------------------------

--
-- Table structure for table `establishments`
--

CREATE TABLE `establishments` (
  `establishment_id` int(11) NOT NULL,
  `eName` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `feedbacks`
--

CREATE TABLE `feedbacks` (
  `feedback_id` int(11) NOT NULL,
  `tenant_id` int(11) DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `establishment_id` int(11) DEFAULT NULL,
  `feedback_level` tinyint(1) NOT NULL CHECK (`feedback_level` between 1 and 5),
  `content` text DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `userEmail` varchar(255) DEFAULT NULL,
  `userName` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `fixes`
--

CREATE TABLE `fixes` (
  `maintenance_id` int(11) NOT NULL,
  `type` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `urgency` enum('urgent','scheduled') NOT NULL,
  `scheduledDate` datetime DEFAULT NULL,
  `contactNum` varchar(15) DEFAULT NULL,
  `status` enum('completed','in progress','pending') DEFAULT 'pending',
  `submissionDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolvedDate` datetime DEFAULT NULL,
  `assignedPerson` varchar(255) DEFAULT NULL,
  `tenant_id` int(11) DEFAULT NULL,
  `establishment_id` int(11) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `histories`
--

CREATE TABLE `histories` (
  `history_id` int(11) NOT NULL,
  `tenant_id` int(11) DEFAULT NULL,
  `actionType` varchar(255) DEFAULT NULL,
  `actionDetails` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

-- --------------------------------------------------------

--
-- Table structure for table `requests`
--

CREATE TABLE `requests` (
  `request_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `visitorName` varchar(255) NOT NULL,
  `contactInfo` varchar(100) DEFAULT NULL,
  `purpose` text DEFAULT NULL,
  `visitDateFrom` datetime NOT NULL,
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `adminComments` text DEFAULT NULL,
  `requestDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `establishment_id` int(11) NOT NULL,
  `decisionTimestamp` timestamp NULL DEFAULT NULL,
  `visitorAffiliation` varchar(255) DEFAULT NULL,
  `visitDateTo` datetime NOT NULL,
  `visitType` enum('regular','overnight') NOT NULL DEFAULT 'regular',
  `checkin` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  `floorNumber` int(11) NOT NULL,
  `requestCount` int(11) DEFAULT 0,
  `visitorLimit` int(11) DEFAULT 0,
  `originalVisitorLimit` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  `tenantProfile` varchar(255) DEFAULT NULL,
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `resetPasswordExpiresAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `utilities`
--

CREATE TABLE `utilities` (
  `utility_id` int(11) NOT NULL,
  `room_id` int(11) DEFAULT NULL,
  `establishment_id` int(11) NOT NULL,
  `utilityType` enum('unit rental','electricity consumption','water usage','internet connection','maintenance fees','dorm amenities') NOT NULL,
  `charge` decimal(10,2) NOT NULL,
  `statementDate` date NOT NULL,
  `dueDate` date NOT NULL,
  `status` enum('unpaid','paid','overdue','partial','cancelled') NOT NULL DEFAULT 'unpaid',
  `perTenant` decimal(10,2) DEFAULT NULL,
  `month` varchar(20) DEFAULT NULL,
  `totalBalance` decimal(10,2) DEFAULT NULL,
  `sharedBalance` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`activity_id`),
  ADD KEY `activities_ibfk_1` (`admin_id`);

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
-- Indexes for table `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `establishment_id` (`establishment_id`);

--
-- Indexes for table `fixes`
--
ALTER TABLE `fixes`
  ADD PRIMARY KEY (`maintenance_id`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `establishment_id` (`establishment_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `histories`
--
ALTER TABLE `histories`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `tenant_id` (`tenant_id`);

--
-- Indexes for table `notices`
--
ALTER TABLE `notices`
  ADD PRIMARY KEY (`notice_id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `establishment_id` (`establishment_id`);

--
-- Indexes for table `requests`
--
ALTER TABLE `requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `fk_establishment_id` (`establishment_id`);

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
-- Indexes for table `utilities`
--
ALTER TABLE `utilities`
  ADD PRIMARY KEY (`utility_id`),
  ADD KEY `establishment_id` (`establishment_id`),
  ADD KEY `utilities_ibfk_1` (`room_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `activity_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `calendars`
--
ALTER TABLE `calendars`
  MODIFY `event_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `establishments`
--
ALTER TABLE `establishments`
  MODIFY `establishment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feedbacks`
--
ALTER TABLE `feedbacks`
  MODIFY `feedback_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fixes`
--
ALTER TABLE `fixes`
  MODIFY `maintenance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `histories`
--
ALTER TABLE `histories`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notices`
--
ALTER TABLE `notices`
  MODIFY `notice_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `requests`
--
ALTER TABLE `requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tenants`
--
ALTER TABLE `tenants`
  MODIFY `tenant_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `utilities`
--
ALTER TABLE `utilities`
  MODIFY `utility_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`) ON DELETE CASCADE;

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
-- Constraints for table `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD CONSTRAINT `feedbacks_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`),
  ADD CONSTRAINT `feedbacks_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`),
  ADD CONSTRAINT `feedbacks_ibfk_3` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`establishment_id`);

--
-- Constraints for table `fixes`
--
ALTER TABLE `fixes`
  ADD CONSTRAINT `fixes_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`),
  ADD CONSTRAINT `fixes_ibfk_2` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`establishment_id`),
  ADD CONSTRAINT `fixes_ibfk_3` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`);

--
-- Constraints for table `histories`
--
ALTER TABLE `histories`
  ADD CONSTRAINT `histories_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`);

--
-- Constraints for table `notices`
--
ALTER TABLE `notices`
  ADD CONSTRAINT `notices_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notices_ibfk_2` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`establishment_id`) ON DELETE CASCADE;

--
-- Constraints for table `requests`
--
ALTER TABLE `requests`
  ADD CONSTRAINT `fk_establishment_id` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`establishment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `requests_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`),
  ADD CONSTRAINT `requests_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`);

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

--
-- Constraints for table `utilities`
--
ALTER TABLE `utilities`
  ADD CONSTRAINT `utilities_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `utilities_ibfk_2` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`establishment_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
