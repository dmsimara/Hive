import Admin from '../models/admin.models.js';
import Tenant from '../models/tenant.models.js';
import Room from '../models/room.models.js';
import Establishment from '../models/establishment.models.js';
import bcryptjs from 'bcryptjs';
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { generateTokenAndSetCookie, generateTokenAndSetTenantCookie } from '../utils/generateTokenAndSetCookie.js';
import { sendPasswordResetEmail, sendResetSuccessEmail, sendTenantVerificationEmail, sendVerificationEmail, sendWelcomeEmail } from '../mailtrap/emails.js';
import { connectDB } from '../db/connectDB.js';
import { Op } from 'sequelize';
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
        return null; // Return null to indicate missing establishmentId
    }

    try {
        console.log('Fetching tenants for establishment ID:', establishmentId);

        const rows = await Tenant.findAll({
            where: {
                establishmentId: establishmentId,  // Ensure tenants belong to the correct establishment
                status: 'active'  // Only fetch active tenants
            }
        });

        if (!rows.length) {
            return [];  // Return empty array if no tenants found
        }

        // Map to plain objects and modify gender to be human-readable
        const plainRows = rows.map(row => {
            const tenant = row.get({ plain: true });
            tenant.gender = tenant.gender === 'M' ? 'Male' : tenant.gender === 'F' ? 'Female' : 'Other';
            return tenant;
        });

        return plainRows;  // Return the mapped tenant data
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return [];  // Return an empty array in case of an error
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
            return null;  // Return null to indicate no rooms found
        }

        // Map to plain objects
        return rooms.map(room => room.get({ plain: true }));
    } catch (error) {
        console.error('Error fetching rooms:', error);
        throw error;  // Re-throw to handle in the main route
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
                // Access the eName from the establishment object
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

        // res.render('userManagement', { rows });
        res.render('userManagement', {
            title: "Hive",
            styles: ["userManagement"],
            rows, 
        });
    } catch (error) {
        console.error('Error in findTenants:', error); 
        res.status(500).json({ success: false, message: 'Unexpected error occurred' });
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
                    { roomType: { [Op.like]: `%${searchTerm}%` } }, // This assumes you also want to search by room type.
                ]
            }
        });

        console.log('Found rooms:', rooms.length); // Log the number of rooms found
        
        const rows = rooms.map(room => room.get({ plain: true }));
        console.log('Rooms Data:', rows); // Log the retrieved room data

        res.render('manageUnits', {
            title: "Hive",
            styles: ["manageUnits"],
            units: rows, 
            lastSearchTerm: searchTerm
        });
    } catch (error) {
        console.error('Error in findUnits:', error); 
        res.status(500).json({ success: false, message: 'An error occurred while searching for units.' });
    }
};

export const addTenant = async (req, res) => {
    const { tenantFirstName, tenantLastName, tenantEmail, gender, mobileNum, tenantPassword, tenantConfirmPassword, stayTo, stayFrom } = req.body;

    try {
        console.log('Incoming request data:', req.body);

        if (!tenantFirstName || !tenantLastName || !tenantEmail || !gender || !mobileNum || !tenantPassword || !tenantConfirmPassword || !stayTo || !stayFrom) {
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

        const existingTenant = await Tenant.findOne({ where: { tenantEmail, establishmentId } });
        if (existingTenant) {
            return res.status(400).json({ success: false, message: "Tenant already exists in this establishment." });
        }

        const hashedPassword = await bcryptjs.hash(tenantPassword, 10);

        console.log('Hashed Password:', hashedPassword);

        const newTenant = await Tenant.create({
            tenantFirstName,
            tenantLastName,
            tenantEmail,
            gender,
            mobileNum,
            stayTo,
            stayFrom,
            tenantPassword: hashedPassword,
            establishmentId
        });

        console.log('New Tenant Created:', newTenant);

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
            }
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

export const editTenant = (req, res) => {
    const tenantId = req.params.tenant_id; 
    const connection = connectDB(); 

    connection.query('SELECT * FROM tenants WHERE tenant_id = ?', [tenantId], (err, rows) => {
        connection.end(); 

        if (err) {
            console.error('Error fetching tenant data:', err);
            return res.status(500).json({ success: false, message: "Error fetching tenant data" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Tenant not found" });
        }

        res.render('editTenant', {
            title: "Hive",
            rows: rows,
        });
    });
};

export const updateTenant = (req, res) => {
     const { tenantFirstName, tenantLastName, tenantEmail, gender, mobileNum } = req.body;

     const tenantId = req.params.tenant_id; 
     const connection = connectDB(); 

     connection.query(
         'UPDATE tenants SET tenantFirstName = ?, tenantLastName = ?, tenantEmail = ?, gender = ?, mobileNum = ? WHERE tenant_id = ?', 
         [tenantFirstName, tenantLastName, tenantEmail, gender, mobileNum, tenantId], 
         (err, result) => {
             connection.end(); 

             // return res.status(400).json({ success: false, message: "Tenant already exists." });
             if (err) {
                 console.error('Error updating tenant data:', err);
                 return res.status(500).json({ success: false, message: "Error updating tenant data"});
             }

             if (result.affectedRows === 0) {
                 return res.status(404).json({ success: false, message: "Tenant not found"});
             }

             return res.status(201).json({ success: true, message: "Tenant updated successfully"});
         }
     );
 };

export const deleteTenant = (req, res) => {
    const tenantId = req.params.tenant_id;
    const connection = connectDB();

    connection.query('DELETE FROM tenants WHERE tenant_id = ?', [tenantId], (err, result) => {
        connection.end();

        if (err) {
            console.error('Error deleting tenant data:', err);
            return res.status(500).send("Error deleting tenant data");
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("Tenant not found");
        }

        res.render('userManagement', {
            title: "Hive",
            message: "Tenant successfully removed",
            rows: [],
        });
    });
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
