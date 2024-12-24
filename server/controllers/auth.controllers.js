import Admin from '../models/admin.models.js';
import Tenant from '../models/tenant.models.js';
import Room from '../models/room.models.js';
import Establishment from '../models/establishment.models.js';
import Calendar from '../models/calendar.models.js';
import Notice from '../models/notice.models.js';
import Feedback from '../models/feedback.models.js';
import bcryptjs from 'bcryptjs';
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { generateTokenAndSetCookie, generateTokenAndSetTenantCookie } from '../utils/generateTokenAndSetCookie.js';
import { connectDB } from '../db/connectDB.js';
import { Sequelize, Op } from 'sequelize';
import { format, startOfWeek, endOfWeek, addHours } from 'date-fns';
import { sendMail } from '../nodemailer/mail.js';

export const adminRegister = async (req, res) => {
    const { adminFirstName, adminLastName, adminEmail, adminPassword, eName } = req.body;

    try {
        // Validate input fields
        if (!adminFirstName || !adminLastName || !adminEmail || !adminPassword || !eName) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Check if admin already exists
        const adminAlreadyExists = await Admin.findOne({ where: { adminEmail } });
        if (adminAlreadyExists) {
            return res.status(400).json({ success: false, message: "Admin already exists" });
        }

        // Find or create establishment
        let establishment = await Establishment.findOne({ where: { eName } });
        if (!establishment) {
            establishment = await Establishment.create({ eName });
            console.log('Created new establishment:', establishment);
        }

        // Hash password and generate verification token
        const hashedPassword = await bcryptjs.hash(adminPassword, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Create new admin
        const admin = await Admin.create({
            adminFirstName,
            adminLastName,
            adminEmail,
            adminPassword: hashedPassword,
            establishmentId: establishment.establishment_id,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
        });

        // Generate token and set cookie
        generateTokenAndSetCookie(res, admin.adminId);

        // Send welcome email
        const subject = 'Welcome to Hive! Confirm Your Email';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #4CAF50; text-align: center;">Welcome to Hive, ${adminFirstName}!</h2>
              <p>Thank you for registering as an admin for <strong>${eName}</strong>.</p>
              <p>To confirm your account and verify your email, please use the following One-Time Password (OTP):</p>
              <div style="text-align: center; margin: 20px 0;">
                 <span style="font-size: 24px; font-weight: bold; color: #4CAF50; letter-spacing: 2px;">${verificationToken}</span>
              </div>
              <p>If you did not create an account with Hive, you can safely disregard this email.</p>
              <p style="margin-top: 30px; font-size: 0.9em; color: #555;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #4CAF50;">thehiveph2024@gmail.com</a>.
              </p>
           </div>
        `;

        await sendMail(adminEmail, subject, null, html);

        // Respond with success
        res.status(201).json({
            success: true,
            message: "Registration successful. Please check your email to verify your account.",
            admin: {
                ...admin.dataValues,
                adminPassword: undefined, // Remove sensitive data
            },
        });
    } catch (error) {
        console.error("Error registering admin:", error);

        // Respond with error
        res.status(500).json({
            success: false,
            message: error.message || "An unexpected error occurred",
        });
    }
};


export const verifyEmail = async (req, res) => {
    const {code} = req.body;

    try {
        // Find admin with the matching verification code and check expiration
        const admin = await Admin.findOne({
            where: {
                verificationToken: code,
                verificationTokenExpiresAt: { [Op.gt]: Date.now() }, // Ensure expiration is in the future
            },
            include: {
                model: Establishment,  
                as: 'Establishment',  
                attributes: ['eName'],  
            },
        });

        if (!admin) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code",
            });
        }

        // Mark admin as verified and clear verification data
        admin.isVerified = true;
        admin.verificationToken = null;
        admin.verificationTokenExpiresAt = null;
        await admin.save();

        const eName = admin.Establishment.eName;   

        // send email
        const subject = 'Welcome to Hive!';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #4CAF50; text-align: center;">Welcome to Hive, ${admin.adminFirstName}!</h2>
              <p style="text-align: center;">We're thrilled to have you as an admin for <strong>${eName}</strong>.</p>
              <p style="text-align: center;">Your email has been successfully verified, and your account is now active!</p>
              <p style="text-align: center;">Here at Hive, we value your contribution and look forward to working with you to make a positive impact. We're excited about all that we can achieve together!</p>
              <br>
              <p style="font-size: 0.9em; color: #555; text-align: center;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: center;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #4CAF50;">thehiveph2024@gmail.com</a>.
              </p>
            </div>
        `;

        await sendMail(admin.adminEmail, subject, null, html);

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

        // Check if the admin email is verified
        if (!admin.isVerified) {
            return res.status(400).json({ success: false, message: "Please verify your email before logging in." });
        }

        const isPasswordValid = await bcryptjs.compare(adminPassword, admin.adminPassword);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        if (!req.session) {
            return res.status(500).json({ success: false, message: "Session is not initialized." });
        }
        
        req.session.adminFirstName = admin.adminFirstName;

        console.log("Admin Object:", JSON.stringify(admin, null, 2));

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

        // send email
        const subject = 'Password Reset Request';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #4CAF50; text-align: center;">Password Reset Request</h2>
              <p style="text-align: left;">We received a request to reset your password for your Hive admin account.</p>
              <p style="text-align: left;">If you did not make this request, you can safely ignore this email.</p>
              <p style="text-align: left;">To reset your password, click the button below:</p>
              <div style="text-align: center; margin: 20px 0;">
                 <a href="${process.env.CLIENT_URL}/reset-password/${resetToken}" 
                    style="background-color: #4CAF50; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">
                    Reset Password
                 </a>
              </div>
              <p style="text-align: left; font-size: 0.9em; color: #555;">The link will expire in 1 hour for security reasons.</p>
              <br>
              <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #4CAF50;">thehiveph2024@gmail.com</a>.
              </p>
           </div>
        `;
        
        await sendMail(adminEmail, subject, null, html);

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

        const hashedPassword = await bcryptjs.hash(adminPassword, 10);

        admin.adminPassword = hashedPassword;
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpiresAt = undefined;

        await admin.save();
        
        // send email
        const subject = 'Password Reset Confirmation';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #4CAF50; text-align: center;">Password Reset Confirmation</h2>
              <p style="text-align: left;">We are writing to confirm that your password for your Hive admin account has been successfully reset.</p>
              <p style="text-align: left;">If you did not initiate this password reset, please contact our support team immediately at <a href="mailto:thehiveph2024@gmail.com" style="color: #4CAF50;">thehiveph2024@gmail.com</a>.</p>
              <p style="text-align: left;">For your security, we recommend the following:</p>
              <ul style="text-align: left; padding-left: 20px; color: #555;">
                 <li>Use a strong and unique password that you haven’t used on other sites.</li>
                 <li>Enable two-factor authentication if available.</li>
                 <li>Avoid using the same password across multiple platforms.</li>
              </ul>
              <br>
              <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #4CAF50;">thehiveph2024@gmail.com</a>.
              </p>
           </div>
        `;
        
        await sendMail(admin.adminEmail, subject, null, html);
        
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

export const updateAdminPassword = async (req, res) => {
    const adminId = req.adminId; 
    const { currentPassword, newPassword } = req.body;

    try {
        console.log("Admin ID from middleware:", adminId); 

        // Find the admin by ID
        const admin = await Admin.findOne({ where: { admin_id: adminId } });

        if (!admin) {
            console.error("Admin not found for Admin ID:", adminId); 
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        // Verify current password
        const isMatch = await bcryptjs.compare(currentPassword, admin.adminPassword);
        if (!isMatch) {
            console.error("Current password does not match for Admin ID:", adminId); 
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        // Hash the new password
        const hashedPassword = await bcryptjs.hash(newPassword, 10);

        // Update the password
        admin.adminPassword = hashedPassword;
        await admin.save();

        console.log("Password successfully updated for Admin ID:", adminId); 

        // Send confirmation email
        const subject = 'Password Change Confirmation';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #4CAF50; text-align: center;">Password Change Confirmation</h2>
              <p style="text-align: left;">We are writing to confirm that your password for your Hive admin account has been successfully updated.</p>
              <p style="text-align: left;">If you did not initiate this change, please contact our support team immediately at <a href="mailto:thehiveph2024@gmail.com" style="color: #4CAF50;">thehiveph2024@gmail.com</a>.</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #4CAF50;">thehiveph2024@gmail.com</a>.
              </p>
           </div>
        `;

        await sendMail(admin.adminEmail, subject, null, html);

        res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("Error in updateAdminPassword:", error);  
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTenantPassword = async (req, res) => {
    const tenantId = req.tenantId; 
    const { currentPassword, newPassword } = req.body;

    try {
        console.log("Tenant ID from middleware:", tenantId); 

        // Find the tenant by ID
        const tenant = await Tenant.findOne({ where: { tenant_id: tenantId } });

        if (!tenant) {
            console.error("Tenant not found for Tenant ID:", tenantId); 
            return res.status(404).json({ success: false, message: "Tenant not found" });
        }

        // Verify current password
        const isMatch = await bcryptjs.compare(currentPassword, tenant.tenantPassword);
        if (!isMatch) {
            console.error("Current password does not match for Tenant ID:", tenantId); 
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        // Hash the new password
        const hashedPassword = await bcryptjs.hash(newPassword, 10);

        // Update the password
        tenant.tenantPassword = hashedPassword;
        await tenant.save();

        console.log("Password successfully updated for Tenant ID:", tenantId); 

        // Send confirmation email
        const subject = 'Password Change Confirmation';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #4CAF50; text-align: center;">Password Change Confirmation</h2>
              <p style="text-align: left;">We are writing to confirm that your password for your Hive tenant account has been successfully updated.</p>
              <p style="text-align: left;">If you did not initiate this change, please contact our support team immediately at <a href="mailto:thehiveph2024@gmail.com" style="color: #4CAF50;">thehiveph2024@gmail.com</a>.</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #4CAF50;">thehiveph2024@gmail.com</a>.
              </p>
           </div>
        `;

        await sendMail(tenant.tenantEmail, subject, null, html);

        res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("Error in updateTenantPassword:", error);  
        res.status(500).json({ success: false, message: error.message });
    }
};

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

export const viewTenants = async (req) => {
    const establishmentId = req.establishmentId; 

    if (!establishmentId) {
        console.error('Establishment ID is undefined. Ensure the user is correctly associated with an establishment.');
        throw new Error("Establishment ID is missing"); 
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
            console.log('No tenants found for establishment ID:', establishmentId);
            return { success: true, tenants: [] }; 
        }

        const plainRows = rows.map(row => {
            const tenant = row.get({ plain: true });
            tenant.gender = tenant.gender === 'M' ? 'Male' : tenant.gender === 'F' ? 'Female' : 'Other';
            return tenant;
        });

        return { success: true, tenants: plainRows };  

    } catch (error) {
        console.error('Error fetching tenants:', error);
        throw new Error('Error fetching tenants'); 
    }
};

export const viewUnits = async (req, res) => {
    const establishmentId = req.establishmentId;

    if (!establishmentId) {
        console.error('Establishment ID is undefined.');
        return { success: false, message: 'Establishment ID is required.' };
    }

    try {
        console.log('Fetching rooms for establishment ID:', establishmentId);

        const rooms = await Room.findAll({
            where: { establishmentId: establishmentId }
        });

        if (!rooms.length) {
            return { success: true, units: [] };  
        }

        const roomData = rooms.map(room => room.get({ plain: true }));
        return { success: true, units: roomData };  
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return { success: false, message: 'Error fetching rooms.' };
    }
};

export const searchTenants = async (req, res, next) => {
    try {
        const searchTerm = req.query.q?.trim() || '';
        console.log("Search Term:", searchTerm);

        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized. No token provided." });
        }

        let establishmentId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            establishmentId = decoded.establishmentId;
            console.log("Establishment ID from Token:", establishmentId);

            if (!establishmentId) {
                return res.status(400).json({ success: false, message: "Establishment ID is required." });
            }
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired token." });
        }

        const tenants = await Tenant.findAll({
            where: {
                establishmentId,
                [Op.or]: [
                    { tenantFirstName: { [Op.like]: `%${searchTerm}%` } },
                    { tenantLastName: { [Op.like]: `%${searchTerm}%` } },
                    { tenantEmail: { [Op.like]: `%${searchTerm}%` } }
                ]
            }
        });

        if (tenants.length === 0) {
            console.log('No tenants found.');
            return res.json({ success: true, tenants: [] });
        }

        console.log('Tenants retrieved successfully.');
        return res.json({ success: true, tenants });

    } catch (error) {
        console.error('Error executing query:', error);
        return res.status(500).json({ success: false, message: 'Database query failed' });
    }
};

export const searchRooms = async (req, res, next) => {
    try {
        const searchTerm = req.query.q?.trim() || '';
        console.log("Search Term:", searchTerm);

        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized. No token provided." });
        }

        let establishmentId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            establishmentId = decoded.establishmentId;
            console.log("Establishment ID from Token:", establishmentId);

            if (!establishmentId) {
                return res.status(400).json({ success: false, message: "Establishment ID is required." });
            }
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired token." });
        }

        const rooms = await Room.findAll({
            where: {
                establishmentId,
                [Op.or]: [
                    { roomNumber: { [Op.like]: `%${searchTerm}%` } },
                    { roomType: { [Op.like]: `%${searchTerm}%` } },
                    { floorNumber: { [Op.like]: `%${searchTerm}%` } }
                ]
            }
        });

        if (rooms.length === 0) {
            console.log('No rooms found.');
            return res.json({ success: true, rooms: [] });
        }

        console.log('Rooms retrieved successfully.');
        return res.json({ success: true, rooms });

    } catch (error) {
        console.error('Error executing query:', error);
        return res.status(500).json({ success: false, message: 'Database query failed' });
    }
};

export const findTenants = async (req, res, next) => {
    try {
        const searchTerm = req.query.q?.trim() || ''; 
        console.log("Search Term:", searchTerm);

        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized. No token provided." });
        }

        let establishmentId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            establishmentId = decoded.establishmentId;
            console.log("Establishment ID from Token:", establishmentId);

            if (!establishmentId) {
                return res.status(400).json({ success: false, message: "Establishment ID is required." });
            }
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired token." });
        }

        const tenants = await Tenant.findAll({
            where: {
                establishmentId,
                [Op.or]: [
                    { tenantFirstName: { [Op.like]: `%${searchTerm}%` } },
                    { tenantLastName: { [Op.like]: `%${searchTerm}%` } }
                ]
            }
        });

        if (tenants.length === 0) {
            console.log('No tenants found.');
            return res.json({ success: true, tenants: [] });
        }

        console.log('Tenants retrieved successfully.');
        return res.json({ success: true, tenants });

    } catch (error) {
        console.error('Error executing query:', error);
        return res.status(500).json({ success: false, message: 'Database query failed' });
    }
};

export const viewAdmins = async (req) => {
    try {
        const adminId = req.adminId;

        const row = await Admin.findOne({
            where: { admin_id: adminId },
            include: {
                model: Establishment,
                attributes: ['eName'],
            },
        });

        if (!row) {
            throw new Error('Admin not found');
        }

        const admin = row.get({ plain: true });

        return {
            admin_id: admin.admin_id,
            adminFirstName: admin.adminFirstName,
            adminLastName: admin.adminLastName,
            adminEmail: admin.adminEmail,
            eName: admin.Establishment ? admin.Establishment.eName : null,
            adminProfile: admin.adminProfile,
        };
    } catch (error) {
        console.error('Error fetching admin:', error);
        throw error; 
    }
};

export const addTenant = async (req, res) => {
    const { 
        tenantFirstName, 
        tenantLastName, 
        tenantEmail, 
        gender, 
        mobileNum, 
        tenantPassword, 
        tenantConfirmPassword, 
        stayTo, 
        stayFrom, 
        room_id, 
        tenantGuardianName, 
        tenantAddress, 
        tenantGuardianNum 
    } = req.body;

    try {
        console.log('Incoming request data:', req.body);

        if (!tenantFirstName || !tenantLastName || !tenantEmail || !gender || !mobileNum || 
            !tenantPassword || !tenantConfirmPassword || !stayTo || !stayFrom || !room_id || 
            !tenantGuardianName || !tenantAddress || !tenantGuardianNum) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        if (tenantPassword !== tenantConfirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }

        const isStayFromValid = Date.parse(stayFrom);
        const isStayToValid = Date.parse(stayTo);

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

        const room = await Room.findOne({ where: { room_id, establishmentId } });
        if (!room) {
            return res.status(400).json({ success: false, message: "Room not found." });
        }

        const establishment = await Establishment.findOne({ where: { establishment_id: establishmentId } });
        if (!establishment) {
            return res.status(404).json({ success: false, message: "Establishment not found." });
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
            room_id: room.room_id,
            tenantGuardianName,
            tenantAddress,
            tenantGuardianNum
        });

        room.roomRemainingSlot -= 1;
        await room.save();

        generateTokenAndSetTenantCookie(res, newTenant.tenant_id, establishmentId);

        // Send confirmation email
        const subject = 'Account Creation Notification';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #4CAF50; text-align: center;">Account Creation Notification</h2>
              <p style="text-align: left;">We are writing to inform you that an account has been created for you under the establishment <strong>${establishment.eName}</strong>.</p> 
              <p style="text-align: left;">For your privacy and security, we strongly recommend that you update your password immediately after logging in.</p>
              <p style="text-align: left;">If you have any questions or did not expect this account creation, please contact our support team immediately at <a href="mailto:thehiveph2024@gmail.com" style="color: #4CAF50;">thehiveph2024@gmail.com</a>.</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #4CAF50;">thehiveph2024@gmail.com</a>.
              </p>
           </div>
        `;

        await sendMail(tenantEmail, subject, null, html);

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
                room_id: newTenant.room_id,
                tenantGuardianName: newTenant.tenantGuardianName,
                tenantAddress: newTenant.tenantAddress, 
                tenantGuardianNum: newTenant.tenantGuardianNum
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

export const addFeedback = async (req, res) => {
    const adminId = req.adminId;  

    try {
      const { userName, userEmail, feedback, content } = req.body;

      const newFeedback = await Feedback.create({
        userName: userName,
        tenant_id: null,   
        admin_id: adminId,   
        establishment_id: null,   
        feedback_level: feedback,  
        content: content,  
        userEmail: userEmail,  
      });
  
      // Send a success response
      res.status(201).json({
        message: 'Feedback submitted successfully!',
        feedback: newFeedback,
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      res.status(500).json({
        message: 'Error saving feedback.',
        error: error.message,
      });
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
    const { tenantFirstName, tenantLastName, tenantEmail, mobileNum, gender, tenantGuardianName, tenantAddress, tenantGuardianNum } = req.body;
    const tenantId = req.params.tenantId;

    try {
        const connection = connectDB();

        const updateQuery = `
            UPDATE Tenants 
            SET tenantFirstName = ?, tenantLastName = ?, tenantEmail = ?, mobileNum = ?, gender = ?, tenantGuardianName = ?, tenantAddress = ?, tenantGuardianNum = ? 
            WHERE tenant_id = ?
        `;
        const [updateResult] = await connection.promise().query(updateQuery, [
            tenantFirstName, tenantLastName, tenantEmail, mobileNum, gender, tenantGuardianName, tenantAddress, tenantGuardianNum, tenantId
        ]);

        if (updateResult.affectedRows > 0) {
            const [rows] = await connection.promise().query('SELECT * FROM Tenants WHERE tenant_id = ?', [tenantId]);
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

export const deleteAdmin = async (req, res) => {
    const adminId = req.params.admin_id;
    console.log('adminId received by backend:', adminId); 

    if (!adminId) {
        return res.status(400).json({ success: false, message: 'Admin ID is required' });
    }

    try {
        const admin = await Admin.findByPk(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const adminCount = await Admin.count();
        if (adminCount <= 1) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete the last admin account'
            });
        }

        await admin.destroy();
        return res.status(200).json({ success: true, message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Error deleting admin:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while deleting the admin' });
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

    connection.query('DELETE FROM Rooms WHERE room_id = ?', [roomId], (err, result) => {
        connection.end();

        if (err) {
            console.error('Error deleting room data:', err);
            return res.status(500).json({ success: false, message: "Error deleting room data" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        res.json({ success: true, message: "Room successfully removed" });
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
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized. No token provided.' });
      }
  
      let establishmentId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        establishmentId = decoded.establishmentId; 
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      }
  
      const rooms = await Room.findAll({
        where: {
          establishmentId,
          roomRemainingSlot: { [Op.gt]: 0 }, 
        },
        attributes: ['room_id', 'roomNumber', 'roomType', 'floorNumber'],
      });
  
      if (rooms.length === 0) {
        return res.status(404).json({ success: false, message: 'No available rooms found for this establishment.' });
      }
  
      res.json({ success: true, availableRooms: rooms });
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      res.status(500).json({ success: false, message: 'An error occurred while fetching available rooms.' });
    }
};

export const addEvent = async (req, res) => {
    const { event_name, event_description, start, end, status } = req.body;

    try {
        console.log('Incoming request data:', req.body);

        if (!event_name || !start || !status) {
            return res.status(400).json({ success: false, message: "Event name, start date, and status are required." });
        }

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

        const startDateUTC = new Date(start).toISOString();  
        const endDateUTC = end ? new Date(end).toISOString() : null;

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
                start: new Date(newEvent.start).toLocaleString(),  
                end: newEvent.end ? new Date(newEvent.end).toLocaleString() : null,
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
        const { event_id, start, end, status } = req.body;

        if (!event_id || (!start && !end && !status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields. At least one field must be updated.' 
            });
        }

        const updatedFields = {};
        if (start) updatedFields.start = start;
        if (end) updatedFields.end = end;
        if (status) updatedFields.status = status;

        const updatedEvent = await Calendar.update(updatedFields, {
            where: { event_id: event_id },
        });

        if (updatedEvent[0] > 0) {  
            const updatedRecord = await Calendar.findOne({ where: { event_id: event_id } });
            return res.json({ 
                success: true, 
                message: 'Event updated successfully!', 
                event: updatedRecord 
            });
        } else {
            return res.status(404).json({ 
                success: false, 
                message: 'Error updating event. Event not found or no changes made.' 
            });
        }
    } catch (error) {
        console.error('Error updating event:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

export const updateEvent = async (req, res) => {
    const { event_name, event_description, start, end, status } = req.body;
    const eventId = req.params.eventId;  

    if (!event_name || !event_description || !start || !end || !status) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields. Please ensure all fields are filled in.' 
        });
    }

    try {
        const connection = connectDB();

        const updateQuery = `
            UPDATE Calendars 
            SET event_name = ?, event_description = ?, start = ?, end = ?, status = ? 
            WHERE event_id = ?
        `;
        console.log('Executing query with data:', {
            event_name, event_description, start, end, status, eventId,
        });

        const [updateResult] = await connection.promise().query(updateQuery, [
            event_name, event_description, start, end, status, eventId,
        ]);

        if (updateResult.affectedRows > 0) {
            const [rows] = await connection.promise().query(
                'SELECT * FROM Calendars WHERE event_id = ?', 
                [eventId]
            );
            connection.end();
            return res.json({ 
                success: true, 
                message: 'Event updated successfully', 
                event: rows[0] 
            });
        } else {
            connection.end();
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found or no changes made.' 
            });
        }
    } catch (err) {
        console.error('Error updating event:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'An error occurred while updating event data' 
        });
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

export const getNotices = async (req, res) => {
    const establishmentId = req.establishmentId;
  
    if (!establishmentId) {
      console.error('Establishment ID is undefined');
      return [];
    }
  
    try {
      console.log('Fetching pinned notices for establishment ID:', establishmentId);
  
      const rows = await Notice.findAll({
        where: {
          establishment_id: establishmentId,
          pinned: 1, 
        },
        order: [['updated_at', 'DESC']],
      });
  
      if (!rows.length) {
        console.log('No pinned notices found for this establishment.');
        return [];
      }
  
      const plainRows = rows.map(row => {
        const notice = row.get({ plain: true });
        notice.updated_at = format(new Date(notice.updated_at), 'MMMM do yyyy, h:mm:ss a');
        return notice;
      });
  
      return plainRows;  
    } catch (error) {
      console.error('Error fetching pinned notices:', error);
      return [];
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


export const viewNotices = async (req, res) => {
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
        if (!title || !content || typeof pinned !== 'boolean' || typeof permanent !== 'boolean') {
            return res.status(400).json({ success: false, message: "All fields are required and 'pinned' and 'permanent' must be boolean." });
        }

        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized. No token provided." });
        }

        let establishmentId, adminId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            establishmentId = decoded.establishmentId;  
            adminId = decoded.adminId; 
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired token." });
        }

        const existingNotice = await Notice.findOne({
            where: {
                title,
                establishment_id: establishmentId 
            }
        });

        if (existingNotice) {
            return res.status(400).json({ success: false, message: "Notice with this title already exists." });
        }

        const newNotice = await Notice.create({
            title,
            content,
            pinned,
            permanent,
            admin_id: adminId, 
            establishment_id: establishmentId,
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
                updated_at: newNotice.updated_at,
            }
        });
    } catch (error) {
        console.error('Error adding notice:', error);
        return res.status(500).json({
            success: false, 
            message: 'Failed to add notice',
            error: error.message || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : null  
        });
    }
};

export const togglePinned = async (req, res) => {
    const { noticeId } = req.params;
    let establishmentId;

    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        establishmentId = decoded.establishmentId;

        const notice = await Notice.findOne({
            where: { notice_id: noticeId, establishment_id: establishmentId },
        });

        if (!notice) {
            return res.status(404).json({ success: false, message: "Notice not found." });
        }

        notice.pinned = notice.pinned ? 0 : 1;

        await notice.save();

        return res.status(200).json({
            success: true,
            isPinned: notice.pinned === 1,
            message: notice.pinned ? "Notice pinned successfully" : "Notice unpinned successfully",
        });
    } catch (error) {
        console.error("Error in togglePinned:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update pinned status.",
        });
    }
};

export const togglePermanent = async (req, res) => {
    const { noticeId } = req.params;
    let establishmentId;

    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        establishmentId = decoded.establishmentId;

        const notice = await Notice.findOne({
            where: { notice_id: noticeId, establishment_id: establishmentId },
        });

        if (!notice) {
            return res.status(404).json({ success: false, message: "Notice not found." });
        }

        notice.permanent = notice.permanent ? 0 : 1;

        await notice.save();

        return res.status(200).json({
            success: true,
            isPermanent: notice.permanent === 1,
            message: notice.permanent ? "Notice marked as permanent" : "Notice unmarked as permanent",
        });
    } catch (error) {
        console.error("Error in togglePermanent:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update permanent status.",
        });
    }
};

export const deleteNotice = async (req, res) => {
    const { noticeId } = req.params;

    try {
        const result = await Notice.destroy({
            where: { notice_id: noticeId } 
        });

        if (result > 0) {
            return res.json({ success: true, message: 'Notice deleted successfully' });
        } else {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }
    } catch (error) {
        console.error('Error deleting notice:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete notice' });
    }
};