import Admin from '../models/admin.models.js';
import Tenant from '../models/tenant.models.js';
import Room from '../models/room.models.js';
import Establishment from '../models/establishment.models.js';
import Calendar from '../models/calendar.models.js';
import Notice from '../models/notice.models.js';
import bcryptjs from 'bcryptjs';
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { generateTokenAndSetCookie, generateTokenAndSetTenantCookie } from '../utils/generateTokenAndSetCookie.js';
import { sendPasswordResetEmail, sendResetSuccessEmail, sendTenantVerificationEmail, sendVerificationEmail, sendWelcomeEmail } from '../mailtrap/emails.js';
import { connectDB } from '../db/connectDB.js';
import { Sequelize, Op } from 'sequelize';
import { format, startOfWeek, endOfWeek, addHours } from 'date-fns';
import { title } from 'process';


export const adminRegister = async (req, res) => {
    const {adminFirstName, adminLastName, adminEmail, adminPassword, eName} = req.body;
   
    try {
        if (!adminFirstName || !adminLastName || !adminEmail || !adminPassword || !eName) {
            throw new Error("All fields are required");
        } 

        const adminAlreadyExists = await Admin.findOne({
            where: { adminEmail }
        });

        console.log("adminAlreadyExists", adminAlreadyExists);

        if (adminAlreadyExists) {
            return res.status(400).json({success: false, message: "Admin already exists"});
        }

        let establishment = await Establishment.findOne({
            where: { eName }
        });

        if (!establishment) {
            establishment = await Establishment.create({
                eName
            });
        }

        const hashedPassword = await bcryptjs.hash(adminPassword, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const admin = new Admin({
            adminFirstName,
            adminLastName,
            adminEmail,
            adminPassword: hashedPassword,
            establishment_id: establishment.establishment_id,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000
        });

        await admin.save();
        
        generateTokenAndSetCookie(res, admin.admin_id, admin.establishment_id);
        
        await sendVerificationEmail(admin.adminEmail, verificationToken);
        
        res.status(201).json({
            success: true,
            message: "Admin created successfully",
            admin: {
                ...admin.dataValues,
                adminPassword: undefined,
            },
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message});
    }
}

export const verifyEmail = async (req, res) => {
    const {code} = req.body;

    try {
        const admin = await Admin.findOne( {
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() }
        })

        if (!admin) {
            return res.status(400).json({success: false, message: "Invalid or expired verification code"})
        }

        admin.isVerified = true;
        admin.verificationToken = undefined;
        admin.verificationTokenExpiresAt = undefined;
        await admin.save();

        await sendWelcomeEmail(admin.adminEmail, admin.adminFirstName);

        res.status(201).json({
            success: true,
            message: "Email verified successfully",
            admin: {
                ...admin.dataValues,
                adminPassword: undefined,
            },
        });
    } catch (error) {
        console.log("Error in database", error);
        res.status(500).json({ success: false, message: error.message});
    }
}

export const adminLogin = async (req, res) => {
    const { adminEmail, adminPassword } = req.body;

    try {
        const admin = await Admin.findOne({
            where: { adminEmail }
        });

        if (!admin) {
            return res.status(400).json({ success: false, message: "Admin not found" });
        }

        const isPasswordValid = await bcryptjs.compare(adminPassword, admin.adminPassword);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        if (!req.session) {
            return res.status(500).json({ success: false, message: "Session is not initialized." });
        }
        
        req.session.adminFirstName = admin.adminFirstName;

        // Log the entire admin object to inspect its properties
        console.log("Admin Object:", JSON.stringify(admin, null, 2));

        // Check establishment_id directly
        if (!admin.establishment_id) {
            return res.status(400).json({ success: false, message: "Establishment ID is required." });
        }

        generateTokenAndSetCookie(res, admin.admin_id, admin.establishment_id);

        admin.lastLogin = new Date();
        await admin.save();

        res.status(201).json({
            success: true,
            message: "Admin logged in successfully",
            admin: {
                ...admin.dataValues,
                adminPassword: undefined,
            },
        });
    } catch (error) {
        console.log("Error in login:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const tenantLogin = async (req, res) => {
    const { tenantEmail, tenantPassword } = req.body;

    try {
        const tenant = await Tenant.findOne({
            where: { tenantEmail }
        });

        if (!tenant) {
            return res.status(400).json({ success: false, message: "Tenant not found" });
        }

        const isPasswordValid = await bcryptjs.compare(tenantPassword, tenant.tenantPassword);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        generateTokenAndSetTenantCookie(res, tenant.tenant_id);

        // tenant.lastLogin = new Date();
        await tenant.save();

        res.status(201).json({
            success: true,
            message: "Tenant logged in successfully",
            admin: {
                ...tenant.dataValues,
                tenantPassword: undefined,
            },
        });
    } catch (error) {
        console.log("Error in login:", error);
        res.status(400).json({ success: false, message: error.message});
    }
}

export const adminLogout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
}

export const tenantLogout = async (req, res) => {
    res.clearCookie("tenantToken");
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
}

export const forgotPassword = async (req, res) => {
    const { adminEmail } = req.body;

    try {
        const admin = await Admin.findOne({
            where: { adminEmail }
        });

        if (!admin) {
            return res.status(400).json({ success: false, message: "Admin not found" });
        };

        // generating reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

        admin.resetPasswordToken = resetToken;
        admin.resetPasswordExpiresAt = resetTokenExpiresAt;
        await admin.save();

        // sending the email
        await sendPasswordResetEmail(
            admin.adminEmail, 
            `${process.env.CLIENT_URL}/reset-password/${resetToken}`
        );

        res.status(200).json({
            success: true,
            message: "Reset password link sent successfully"
        })
    } catch (error) {
        console.log("Error in forgotPassword", error);
        res.status(400).json({ success: false, message: error.message});
    }
}

export const resetPassword = async (req, res) => {
    try {
        const {token} = req.params;
        const {adminPassword} = req.body;

        const admin = await Admin.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: {
                 $gt: Date.now()
            },
        });

        if (!admin) {
            return res.status(400).json({ success: false, message: "Reset password token expired or invalid" });
        }

        // to update the password
        const hashedPassword = await bcryptjs.hash(adminPassword, 10);

        admin.adminPassword = hashedPassword;
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpiresAt = undefined;

        await admin.save();

        await sendResetSuccessEmail(admin.adminEmail);
        
        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        })
    } catch (error) {
        console.log(200).json({
            success: false,
            message: error.message
        });
    }
}

export const checkAuth = async (req, res) => {
    
    try{
        const admin = await Admin.findOne({
            where: { admin_id: req.adminId }
        });
    
        res.status(200).json({
            success: true,
            admin: {
                ...admin.dataValues,
                adminPassword: undefined,
            }
        });
    } catch (error) {
        console.log("Error in checkAuth", error);
        res.status(500).json({ success: false, message: error.message});
    }
};

export const checkTenantAuth = async (req, res) => {
    try{
        const tenant = await Tenant.findOne({
            where: { tenant_id: req.tenantId }
        });
    
        res.status(200).json({
            success: true,
            tenant: {
                ...tenant.dataValues,
                tenantPassword: undefined,
            }
        });
    } catch (error) {
        console.log("Error in checkAuth", error);
        res.status(500).json({ success: false, message: error.message});
    }
};

export const viewTenants = async (req, res) => {
    const establishmentId = req.establishmentId;

    if (!establishmentId) {
        console.error('Establishment ID is undefined.');
        return null; 
    }

    try {
        console.log('Fetching tenants for establishment ID:', establishmentId);

        const rows = await Tenant.findAll({
            where: {
                establishmentId: establishmentId,  
                status: 'active'  
            }
        });

        if (!rows.length) {
            return []; 
        }

        const plainRows = rows.map(row => {
            const tenant = row.get({ plain: true });
            tenant.gender = tenant.gender === 'M' ? 'Male' : tenant.gender === 'F' ? 'Female' : 'Other';
            return tenant;
        });

        return plainRows;  
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return []; 
    }
};

export const viewUnits = async (req, res) => {
    const establishmentId = req.establishmentId;

    if (!establishmentId) {
        console.error('Establishment ID is undefined.');
        return res.status(400).json({ success: false, message: 'Establishment ID is required.' });
    }

    try {
        console.log('Fetching rooms for establishment ID:', establishmentId);

        const rooms = await Room.findAll({
            where: { establishmentId: establishmentId }
        });

        if (!rooms.length) {
            return null;  
        }

        return rooms.map(room => room.get({ plain: true }));
    } catch (error) {
        console.error('Error fetching rooms:', error);
        throw error; 
    }
};

export const viewAdmins = async (req, res) => {
    try {
        const rows = await Admin.findAll({
            include: {
                model: Establishment,
                attributes: ['eName'], 
            },
        });

        const plainRows = rows.map(row => {
            const admin = row.get({ plain: true });
            return {
                admin_id: admin.admin_id,
                adminFirstName: admin.adminFirstName,
                adminLastName: admin.adminLastName,
                adminEmail: admin.adminEmail,
                eName: admin.Establishment ? admin.Establishment.eName : null,
                adminProfile: admin.adminProfile,
            };
        });

        return plainRows;
    } catch (error) {
        console.error('Error fetching admins:', error);
        return res.status(500).json({ success: false, message: 'Error fetching admins' });
    }
};

export const findTenants = async (req, res) => {
    const searchTerm = req.body.search;

    console.log('Received search term:', searchTerm); 

    if (!searchTerm) {
        return res.status(400).json({ success: false, message: 'Search term is required' });
    }

    try {
        const tenants = await Tenant.findAll({
            where: {
                [Op.or]: [
                    { tenantFirstName: { [Op.like]: `%${searchTerm}%` } },
                    { tenantLastName: { [Op.like]: `%${searchTerm}%` } }
                ]
            }
        });

        const rows = tenants.map(tenant => tenant.get({ plain: true }));

        const admins = await viewAdmins(req, res); 

        res.render('userManagement', {
            title: "Hive",
            styles: ["userManagement"],
            rows,
            admin: admins 
        });
    } catch (error) {
        console.error('Error in findTenants:', error); 
        res.status(500).json({ success: false, message: 'Unexpected error occurred' });
    }
};

export const findDashTenants = async (req, res) => {
    const searchTerm = req.body.searchTenants?.trim();
    console.log('Received search term: ', searchTerm);

    if (!searchTerm) {
        try {
            const tenants = await Tenant.findAll();
            return res.json({ success: true, tenants: tenants });
        } catch (error) {
            console.error('Error fetching all tenants:', error);
            return res.status(500).json({ success: false, message: 'An error occurred while fetching tenants.' });
        }
    }

    try {
        let whereClause;

        const lowerSearchTerm = searchTerm.toLowerCase();

        const searchWords = lowerSearchTerm.split(' ').filter(word => word.length > 0);
        
        if (searchWords.length === 1) {
            whereClause = {
                [Op.or]: [
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('tenantFirstName')), { [Op.like]: `%${searchWords[0]}%` }),
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('tenantLastName')), { [Op.like]: `%${searchWords[0]}%` })
                ]
            };
        } else if (searchWords.length > 1) {
            whereClause = {
                [Op.and]: [
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('tenantFirstName')), { [Op.like]: `%${searchWords[0]}%` }),
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('tenantLastName')), { [Op.like]: `%${searchWords[1]}%` })
                ]
            };
        }

        const tenants = await Tenant.findAll({
            where: whereClause
        });

        const rows = tenants.map(tenant => tenant.get({ plain: true }));

        if (req.xhr) {
            return res.json({ success: true, tenants: rows });
        }

        const admins = await viewAdmins(req, res); 
        res.render('adminDashboard', {
            title: "Hive",
            styles: ["adminDashboard"],
            tenants: rows,
            admins: admins,
            lastSearchTerm: searchTerm
        });
    } catch (error) {
        console.error('Error in findDashTenants:', error);
        res.status(500).json({ success: false, message: 'An error occurred while searching for tenants.' });
    }
};

export const findUnits = async (req, res) => {
    const searchTerm = req.body.searchUnits;
    console.log('Received search term:', searchTerm);

    if (!searchTerm) {
        console.log('No search term provided.');
        return res.status(400).json({ success: false, message: 'Search term is required' });
    }

    try {
        const rooms = await Room.findAll({
            where: {
                [Op.or]: [
                    { roomNumber: { [Op.like]: `%${searchTerm}%` } },
                    { roomType: { [Op.like]: `%${searchTerm}%` } }
                ]
            }
        });

        console.log('Found rooms:', rooms.length);

        const rows = rooms.map(room => room.get({ plain: true }));
        console.log('Rooms Data:', rows);

        const admins = await viewAdmins(req, res);  

        res.render('manageUnits', {
            title: "Hive",
            styles: ["manageUnits"],
            units: rows,
            lastSearchTerm: searchTerm,
            admins: admins 
        });
    } catch (error) {
        console.error('Error in findUnits:', error);
        res.status(500).json({ success: false, message: 'An error occurred while searching for units.' });
    }
};

export const addTenant = async (req, res) => {
    const { tenantFirstName, tenantLastName, tenantEmail, gender, mobileNum, tenantPassword, tenantConfirmPassword, stayTo, stayFrom, room_id } = req.body;

    try {
        console.log('Incoming request data:', req.body);

        if (!tenantFirstName || !tenantLastName || !tenantEmail || !gender || !mobileNum || !tenantPassword || !tenantConfirmPassword || !stayTo || !stayFrom || !room_id) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        if (tenantPassword !== tenantConfirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }

        const isStayFromValid = Date.parse(stayFrom);
        const isStayToValid = Date.parse(stayTo);

        console.log('Parsed Stay From:', isStayFromValid, 'Parsed Stay To:', isStayToValid);

        if (isNaN(isStayFromValid) || isNaN(isStayToValid)) {
            return res.status(400).json({ success: false, message: "Invalid date format." });
        }

        if (new Date(stayTo) < new Date(stayFrom)) {
            return res.status(400).json({ success: false, message: "End date cannot be before start date." });
        }

        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized. No token provided." });
        }

        let establishmentId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            establishmentId = decoded.establishmentId;

            console.log('Decoded JWT Token:', decoded);
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired token." });
        }

        const availableRooms = await Room.findAll({
            where: {
                establishmentId,
                roomRemainingSlot: { [Sequelize.Op.gt]: 0 }, 
            }
        });

        if (availableRooms.length === 0) {
            return res.status(400).json({ success: false, message: "No available rooms for this establishment." });
        }

        const existingTenant = await Tenant.findOne({ where: { tenantEmail, establishmentId } });
        if (existingTenant) {
            return res.status(400).json({ success: false, message: "Tenant already exists in this establishment." });
        }

        const hashedPassword = await bcryptjs.hash(tenantPassword, 10);
        console.log('Hashed Password:', hashedPassword);

        const room = await Room.findOne({ where: { room_id, establishmentId } });

        if (!room) {
            return res.status(400).json({ success: false, message: "Room not found." });
        }

        const newTenant = await Tenant.create({
            tenantFirstName,
            tenantLastName,
            tenantEmail,
            gender,
            mobileNum,
            stayTo,
            stayFrom,
            tenantPassword: hashedPassword,
            establishmentId,
            room_id: room.room_id
        });

        console.log('New Tenant Created:', newTenant);

        room.roomRemainingSlot -= 1;
        await room.save();  

        generateTokenAndSetTenantCookie(res, newTenant.tenant_id, establishmentId);

        return res.status(201).json({
            success: true,
            message: "Tenant added successfully",
            tenant: {
                tenantFirstName: newTenant.tenantFirstName,
                tenantLastName: newTenant.tenantLastName,
                tenantEmail: newTenant.tenantEmail,
                gender: newTenant.gender,
                mobileNum: newTenant.mobileNum,
                stayTo: newTenant.stayTo,
                stayFrom: newTenant.stayFrom,
                room_id: newTenant.room_id 
            },
            availableRooms: availableRooms.map(room => ({
                room_id: room.room_id,
                roomNumber: room.roomNumber,
                roomType: room.roomType,
                floorNumber: room.floorNumber
            }))
        });
    } catch (error) {
        console.error('Error adding tenant:', error);
        return res.status(500).json({ success: false, message: 'Failed to add tenant', error: error.message });
    }
};

  export const addUnit = async (req, res) => {
    try {
        const { roomNumber, roomType, roomTotalSlot, roomRemainingSlot, floorNumber } = req.body;

        const token = req.cookies.token; 
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 

        const establishmentId = decoded.establishmentId; 

        const existingRoom = await Room.findOne({
            where: {
                roomNumber,
                establishmentId
            }
        });

        if (existingRoom) {
            return res.status(400).json({ message: 'Room with this number already exists in this establishment.' });
        }

        const newRoom = await Room.create({
            roomNumber,
            roomType,
            roomTotalSlot,
            roomRemainingSlot: roomTotalSlot,
            floorNumber,
            establishmentId
        });

        res.status(201).json({ message: 'Room added successfully!', room: newRoom });
    } catch (error) {
        console.error('Error adding room:', error);
        res.status(500).json({ message: 'Failed to add room', error: error.message });
    }
};

export const addTenantView = async (req, res) => {
    res.render('addTenants', {
        title: "Hive",
        styles: ["addTenants"]
    });
};

export const addUnitView = async (req, res) => {
    res.render("addUnits", {
        title: "Hive",
        styles: ["addUnits"]
    });
}

export const editTenant = async (req, res) => {
    const tenantId = req.params.tenant_id; 

    if (!tenantId) {
        return res.status(400).send('Tenant ID is required');
    }

    try {
        const tenant = await Tenant.findOne({
            where: { tenant_id: tenantId },
        });

        if (!tenant) {
            return res.status(404).send('Tenant not found');
        }

        res.render('editTenant', { tenant });
    } catch (error) {
        console.error('Error fetching tenant data:', error);
        res.status(500).send('Error fetching tenant data');
    }
};

export const updateTenant = async (req, res) => {
    const { tenantFirstName, tenantLastName, tenantEmail, mobileNum, gender } = req.body;
    const tenantId = req.params.tenantId;

    try {
        const connection = connectDB();

        const updateQuery = `
            UPDATE tenants 
            SET tenantFirstName = ?, tenantLastName = ?, tenantEmail = ?, mobileNum = ?, gender = ? 
            WHERE tenant_id = ?
        `;
        const [updateResult] = await connection.promise().query(updateQuery, [
            tenantFirstName, tenantLastName, tenantEmail, mobileNum, gender, tenantId
        ]);

        if (updateResult.affectedRows > 0) {
            const [rows] = await connection.promise().query('SELECT * FROM tenants WHERE tenant_id = ?', [tenantId]);
            connection.end(); 
            return res.json({ success: true, message: 'Tenant updated successfully', tenant: rows[0] });
        } else {
            connection.end();
            return res.status(404).send("Tenant not found or no changes made.");
        }
    } catch (err) {
        console.error('Error updating tenant:', err);
        return res.status(500).send('An error occurred while updating tenant data');
    }
};

export const deleteTenant = async (req, res) => {
    const tenantId = req.params.tenant_id;
    console.log('tenantId received by backend:', tenantId); 

    if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant ID is required' });
    }

    try {
        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        const room = await Room.findByPk(tenant.room_id);  
        if (room) {
            room.roomRemainingSlot += 1;
            await room.save();  
            console.log('Updated roomRemainingSlot:', room.roomRemainingSlot);
        }

        await tenant.destroy();
        return res.status(200).json({ success: true, message: 'Tenant deleted successfully' });
    } catch (error) {
        console.error('Error deleting tenant:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while deleting the tenant' });
    }
};

export const deleteUnit = (req, res) => {
    const roomId = req.params.room_id;
    const connection = connectDB();

    connection.query('DELETE FROM rooms WHERE room_id = ?', [roomId], (err, result) => {
        connection.end();

        if (err) {
            console.error('Error deleting room data:', err);
            return res.status(500).send("Error deleting room data");
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("Room not found");
        }

        res.render('manageUnits', {
            title: "Hive",
            message: "Room successfully removed",
            rows: [],
        });
    });
};

export const getOccupiedUnits = async (req, res) => {
    const establishmentId = req.establishmentId; 

    try {
        const rooms = await Room.findAll({
            where: { establishmentId },
            raw: true, 
        });

        let occupiedUnits = 0;

        rooms.forEach(room => {
            const occupiedSlots = room.roomTotalSlot - room.roomRemainingSlot;
            if (occupiedSlots > 0) {
                occupiedUnits += occupiedSlots; 
            }
        });

        return occupiedUnits; 

    } catch (error) {
        console.error("Error calculating occupied units:", error);
        if (!res.headersSent) {
            res.status(500).send("An error occurred");
        }
    }
};

export const getAvailableRooms = async (req, res) => {
    try {
      const rooms = await Room.findAll({
        where: { roomRemainingSlot: { [Op.gt]: 0 } },  // This can be your "available" condition
        attributes: ['room_id', 'roomNumber', 'roomType', 'floorNumber'],
      });
  
      res.json({ success: true, availableRooms: rooms });
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      res.status(500).json({ success: false, message: 'An error occurred while fetching available rooms.' });
    }
  };

// auth.controllers.js
export const addEvent = async (req, res) => {
    const { event_name, event_description, start, end, status } = req.body;

    try {
        console.log('Incoming request data:', req.body);

        // Validate input fields
        if (!event_name || !start || !status) {
            return res.status(400).json({ success: false, message: "Event name, start date, and status are required." });
        }

        // Validate date fields
        const isStartValid = Date.parse(start);
        const isEndValid = Date.parse(end);

        console.log('Parsed Start Date:', isStartValid, 'Parsed End Date:', isEndValid);

        if (isNaN(isStartValid)) {
            return res.status(400).json({ success: false, message: "Invalid start date format." });
        }

        if (end && isNaN(isEndValid)) {
            return res.status(400).json({ success: false, message: "Invalid end date format." });
        }

        if (new Date(end) < new Date(start)) {
            return res.status(400).json({ success: false, message: "End date cannot be before start date." });
        }

        // Verify the user's authentication token
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized. No token provided." });
        }

        let establishmentId;
        let adminId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            establishmentId = decoded.establishmentId;
            adminId = decoded.adminId; 
            console.log('Decoded JWT Token:', decoded);
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired token." });
        }

        // Convert dates to UTC before saving them to the database
        const startDateUTC = new Date(start).toISOString();  // Converts start to UTC ISO string
        const endDateUTC = end ? new Date(end).toISOString() : null;  // Converts end to UTC ISO string

        // Create new event with UTC dates
        const newEvent = await Calendar.create({
            event_name,
            event_description,
            start: startDateUTC,
            end: endDateUTC,
            status,
            establishment_id: establishmentId,  
            admin_id: adminId, 
        });

        console.log('New Event Created:', newEvent);

        return res.status(201).json({
            success: true,
            message: "Event added successfully",
            event: {
                event_name: newEvent.event_name,
                event_description: newEvent.event_description,
                start: newEvent.start,
                end: newEvent.end,
                status: newEvent.status
            }
        });
    } catch (error) {
        console.error('Error adding event:', error);
        return res.status(500).json({ success: false, message: 'Failed to add event', error: error.message });
    }
};

export const viewEvents = async (req) => {
    const token = req.cookies.token;  
    if (!token) {
        console.log('No token found');
        return { success: false, message: 'Authorization token is missing' };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const establishmentId = decoded.establishmentId;
        console.log('Decoded token:', decoded);
        console.log('Establishment ID:', establishmentId); 

        if (!establishmentId) {
            console.log('Establishment ID not found');
            return { success: false, message: 'Establishment ID not found' };
        }

        const events = await Calendar.findAll({
            where: { establishment_id: establishmentId },
            order: [['start', 'ASC']],
        });

        if (!events || events.length === 0) {
            console.log('No events found');
            return { success: false, message: 'No events found for the establishment' };
        }

        const formattedEvents = events.map(event => ({
            id: event.event_id,
            title: event.event_name,
            start: event.start.toISOString(),
            end: event.end ? event.end.toISOString() : null,
            description: event.event_description || '',
            status: event.status,
        }));

        return { success: true, events: formattedEvents };
    } catch (error) {
        console.error('Error decoding token:', error);
        return { success: false, message: 'Failed to decode token', error: error.message };
    }
};

export const editEvent = async (req, res) => {
    try {
        const { event_id, start, end } = req.body;

        const updatedEvent = await Calendar.update(
            { start, end },  
            {
                where: {
                    event_id: event_id  
                }
            });

        if (updatedEvent[0] > 0) {  
            res.json({ success: true, message: 'Event updated successfully!' });
        } else {
            res.status(400).json({ success: false, message: 'Error updating event. Event not found.' });
        }
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteEvent = async (req, res) => {
    const { eventId } = req.params;

    try {
        const result = await Calendar.destroy({
            where: { event_id: eventId }
        });

        if (result > 0) {
            return res.json({ success: true, message: 'Event deleted successfully' });
        } else {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete event' });
    }
};

export const getEvents = async (req, res) => {
    const establishmentId = req.establishmentId;

    if (!establishmentId) {
        console.error('Establishment ID is undefined.');
        return null;
    }

    try {
        console.log('Fetching events for establishment ID:', establishmentId);

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }); 
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); 

        const weekStartUTC = addHours(weekStart, -8);
        const weekEndUTC = addHours(weekEnd, -8); 

        console.log("Week start (UTC):", weekStartUTC);
        console.log("Week end (UTC):", weekEndUTC);

        const rows = await Calendar.findAll({
            where: {
                establishment_id: establishmentId,
                start: {
                    [Op.gte]: weekStartUTC, 
                    [Op.lte]: weekEndUTC, 
                },
            },
            order: [['start', 'ASC']], 
        });

        if (!rows.length) {
            console.log('No events found for this week.');
            return [];
        }

        const plainRows = rows.map(row => {
            const event = row.get({ plain: true });
            event.status = formatEventStatus(event.status); 
            
            event.start = format(new Date(event.start), "EEE, MMM d, yyyy h:mm a");
            event.end = format(new Date(event.end), "EEE, MMM d, yyyy h:mm a");
            
            return event;
        });

        return plainRows;  
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
};

const formatEventStatus = (status) => {
    switch (status) {
        case 'Not Started': return 'Pending Start';
        case 'Working in Progress': return 'In Progress';
        case 'On Hold': return 'Paused';
        case 'Done': return 'Completed';
        default: return status;
    }
};

export const updateEvent = async (req, res) => {
    const { event_name, event_description, start, end, status } = req.body;
    const eventId = req.params.eventId;  

    try {
        const connection = connectDB();

        const updateQuery = `
            UPDATE calendars 
            SET event_name = ?, event_description = ?, start = ?, end = ?, status = ? 
            WHERE event_id = ?
        `;
        const [updateResult] = await connection.promise().query(updateQuery, [
            event_name, event_description, start, end, status, eventId
        ]);

        if (updateResult.affectedRows > 0) {
            const [rows] = await connection.promise().query('SELECT * FROM calendars WHERE event_id = ?', [eventId]);
            connection.end();
            return res.json({ success: true, message: 'Event updated successfully', event: rows[0] });
        } else {
            connection.end();
            return res.status(404).json({ success: false, message: "Event not found or no changes made." });
        }
    } catch (err) {
        console.error('Error updating event:', err);
        return res.status(500).json({ success: false, message: 'An error occurred while updating event data' });
    }
};

export const viewNotices = async (req, res) => {
    console.log('Entering viewNotices...');
    const { establishmentId } = req;
  
    if (!establishmentId) {
      console.error('Establishment ID is undefined.');
      return { success: false, message: 'Establishment ID is required.' };
    }
  
    try {
      const rows = await Notice.findAll({
        where: { establishment_id: establishmentId },
        order: [['pinned', 'DESC'], ['permanent', 'DESC'], ['updated_at', 'DESC']],
      });
  
      const formattedNotices = rows.map(row => ({
        ...row.get({ plain: true }),
        updated_at: format(new Date(row.updated_at), 'MMMM dd, yyyy'),
      }));
  
      return { success: true, notices: formattedNotices }; 
  
    } catch (error) {
      console.error('Error fetching notices:', error);
      return { success: false, message: 'Error fetching notices.' };
    }
  };
  
export const pinnedNotices = async (req, res) => {
    const { establishmentId } = req;
    if (!establishmentId) return res.status(400).json({ success: false, message: 'Establishment ID is required.' });
  
    try {
      const rows = await Notice.findAll({
        where: { establishment_id: establishmentId, pinned: true },
        order: [['updated_at', 'DESC']],
      });
  
      if (rows.length === 0) {
        return res.json({
          success: true,
          notices: [{
            title: 'No pinned notices yet',
            content: 'There are no pinned notices at the moment. Please check back later.',
            updated_at: 'Just now',
            pinned: false,
            permanent: false
          }]
        });
      }
  
      const notices = rows.map(row => ({
        ...row.get({ plain: true }),
        updated_at: format(new Date(row.updated_at), 'MMMM dd, yyyy'),
      }));
  
      res.json({ success: true, notices });
    } catch (error) {
      console.error('Error fetching pinned notices:', error);
      res.status(500).json({ success: false, message: 'Error fetching pinned notices.' });
    }
};
  
export const permanentNotices = async (req, res) => {
    const { establishmentId } = req;
    if (!establishmentId) return res.status(400).json({ success: false, message: 'Establishment ID is required.' });
  
    try {
      const rows = await Notice.findAll({
        where: { establishment_id: establishmentId, permanent: true },
        order: [['updated_at', 'DESC']],
      });
  
      if (rows.length === 0) {
        return res.json({
          success: true,
          notices: [{
            title: 'No permanent notices yet',
            content: 'There are no permanent notices at the moment. Please check back later.',
            updated_at: 'Just now',
            pinned: false,
            permanent: false
          }]
        });
      }
  
      const notices = rows.map(row => ({
        ...row.get({ plain: true }),
        updated_at: format(new Date(row.updated_at), 'MMMM dd, yyyy'),
      }));
  
      res.json({ success: true, notices });
    } catch (error) {
      console.error('Error fetching permanent notices:', error);
      res.status(500).json({ success: false, message: 'Error fetching permanent notices.' });
    }
};

export const addNotice = async (req, res) => {
    const { title, content, pinned, permanent } = req.body;

    try {
        // Validate that the necessary fields are present
        if (!title || !content || pinned === undefined || permanent === undefined) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        // Get the establishmentId from the token (assuming JWT token is passed via cookies)
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized. No token provided." });
        }

        let establishmentId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            establishmentId = decoded.establishmentId;
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired token." });
        }

        // Check if the notice already exists for the given establishment
        const existingNotice = await Notice.findOne({ 
            where: { 
                title,
                establishmentId 
            } 
        });

        if (existingNotice) {
            return res.status(400).json({ success: false, message: "Notice with this title already exists." });
        }

        // Create a new notice record in the database
        const newNotice = await Notice.create({
            title,
            content,
            pinned,     // Set pinned based on user interaction
            permanent,  // Set permanent based on user interaction
            establishmentId,
        });

        return res.status(201).json({
            success: true,
            message: "Notice added successfully",
            notice: {
                notice_id: newNotice.notice_id,
                title: newNotice.title,
                content: newNotice.content,
                pinned: newNotice.pinned,
                permanent: newNotice.permanent,
                updated_at: newNotice.updated_at,  // Optional: Adjust if needed
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to add notice', error: error.message });
    }
};