import Admin from '../models/admin.models.js';
import Tenant from '../models/tenant.models.js';
import Room from '../models/room.models.js';
import Establishment from '../models/establishment.models.js';
import Calendar from '../models/calendar.models.js';
import Notice from '../models/notice.models.js';
import Feedback from '../models/feedback.models.js';
import Utility from '../models/utility.models.js';
import Activity from '../models/activity.models.js';
import History from '../models/history.models.js';
import Fix from '../models/fix.models.js';
import Request from '../models/request.models.js';
import bcryptjs from 'bcryptjs';
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { generateTokenAndSetCookie, generateTokenAndSetTenantCookie } from '../utils/generateTokenAndSetCookie.js';
import { connectDB } from '../db/connectDB.js';
import { Sequelize, Op } from 'sequelize';
import { sequelize } from '../models/room.models.js';
import { format, startOfWeek, endOfWeek, addHours } from 'date-fns';
import { sendMail } from '../nodemailer/mail.js';
import moment from 'moment-timezone';

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
              <h2 style="color: #FB7C41; text-align: center;">Welcome to Hive, ${adminFirstName}!</h2>
              <p>Thank you for registering as an admin for <strong>${eName}</strong>.</p>
              <p>To confirm your account and verify your email, please use the following One-Time Password (OTP):</p>
              <div style="text-align: center; margin: 20px 0;">
                 <span style="font-size: 24px; font-weight: bold; color: #B32C1A; letter-spacing: 2px;">${verificationToken}</span>
              </div>
              <p>If you did not create an account with Hive, you can safely disregard this email.</p>
              <p style="margin-top: 30px; font-size: 0.9em; color: #555;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #FB7C41;">thehiveph2024@gmail.com</a>.
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
                adminPassword: undefined, 
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
        const admin = await Admin.findOne({
            where: {
                verificationToken: code,
                verificationTokenExpiresAt: { [Op.gt]: Date.now() }, 
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

        admin.isVerified = true;
        admin.verificationToken = null;
        admin.verificationTokenExpiresAt = null;
        await admin.save();

        const eName = admin.Establishment.eName;   

        // send email
        const subject = 'Welcome to Hive!';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #FB7C41; text-align: center;">Welcome to Hive, ${admin.adminFirstName}!</h2>
              <p style="text-align: left;">We're thrilled to have you as an admin for <strong>${eName}</strong>.</p>
              <p style="text-align: left;">Your email has been successfully verified, and your account is now active!</p>
              <p style="text-align: left;">Here at Hive, we value your contribution and look forward to working with you to make a positive impact. We're excited about all that we can achieve together!</p>
              <br>
              <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: left;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A;">thehiveph2024@gmail.com</a>.
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

        logActivity(admin.admin_id, 'login_success', `Admin ${admin.adminFirstName} (${adminEmail}) logged in successfully`);

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
        logActivity(null, 'login_error', `Error during login attempt for admin email: ${adminEmail}. Error: ${error.message}`);
        res.status(400).json({ success: false, message: error.message });
    }
};

export function logActivity(adminId, actionType, actionDetails = '') {
    const connection = connectDB();   

    const query = `
        INSERT INTO Activities (admin_id, actionType, actionDetails) 
        VALUES (?, ?, ?)
    `;

    connection.query(query, [adminId, actionType, actionDetails], (err, results) => {
        if (err) {
            console.error('Error logging activity:', err);
            return;
        }
        console.log('Activity logged successfully:', results.insertId);
    });

    connection.end();  
}

export function logHistory(tenantId, actionType, actionDetails = '') {
    const connection = connectDB(); 

    const query = `
        INSERT INTO Histories (tenant_id, actionType, actionDetails) 
        VALUES (?, ?, ?)
    `;

    connection.query(query, [tenantId, actionType, actionDetails], (err, results) => {
        if (err) {
            console.error('Error logging history:', err);
            return;
        }
        console.log('History logged successfully:', results.insertId);
    });

    connection.end(); 
}

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

        logHistory(tenant.tenant_id, 'login_success', `Tenant ${tenant.tenantFirstName} (Email: ${tenantEmail}) logged in successfully`);

        res.status(201).json({
            success: true,
            message: "Tenant logged in successfully",
            tenant: {
                ...tenant.dataValues,
                tenantPassword: undefined,
            },
        });
    } catch (error) {
        console.log("Error in login:", error);
        logHistory(null, 'login_error', `Error during login attempt for tenant email: ${tenantEmail}. Error: ${error.message}`);
        res.status(400).json({ success: false, message: error.message});
    }
}

export const adminLogout = async (req, res) => {
    try {
        res.clearCookie("token");

        const adminId = req.adminId;

        if (!adminId) {
            return res.status(400).json({
                success: false,
                message: "Admin ID not found for logging activity."
            });
        }

        const admin = await Admin.findOne({
            where: { admin_id: adminId }
        });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found for logging out."
            });
        }

        const timestamp = moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');

        const logMessage = `Admin ${admin.adminFirstName} ${admin.adminLastName} logged out successfully at ${timestamp}.`;

        logActivity(adminId, 'admin logout', logMessage);

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred during logout."
        });
    }
};

export const tenantLogout = async (req, res) => {
    try {
        res.clearCookie("tenantToken");

        const tenantId = req.tenantId;

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "Tenant ID not found for logging activity."
            });
        }

        const tenant = await Tenant.findOne({
            where: { tenant_id: tenantId }
        });

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found for logging out."
            });
        }

        const timestamp = moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');

        const logMessage = `Tenant ${tenant.tenantFirstName} ${tenant.tenantLastName} logged out successfully at ${timestamp}.`;

        logHistory(tenantId, 'tenant logout', logMessage);

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred during logout."
        });
    }
};

export const forgotPassword = async (req, res) => {
    const { adminEmail } = req.body;

    try {
        const admin = await Admin.findOne({
            where: { adminEmail }
        });

        if (!admin) {
            return res.status(400).json({ success: false, message: "Admin not found" });
        };

        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

        admin.resetPasswordToken = resetToken;
        admin.resetPasswordExpiresAt = resetTokenExpiresAt;
        await admin.save();

        const subject = 'Password Reset Request';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #FB7C41; text-align: center;">Password Reset Request</h2>
              <p style="text-align: left;">We received a request to reset your password for your Hive admin account.</p>
              <p style="text-align: left;">If you did not make this request, you can safely ignore this email.</p>
              <p style="text-align: left;">To reset your password, click the button below:</p>
              <div style="text-align: center; margin: 20px 0;">
                 <a href="${process.env.CLIENT_URL}/reset-password/${resetToken}" 
                    style="background-color: #B32C1A; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">
                    Reset Password
                 </a>
              </div>
              <p style="text-align: left; font-size: 0.9em; color: #555;">The link will expire in 1 hour for security reasons.</p>
              <br>
              <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A;">thehiveph2024@gmail.com</a>.
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

export const forgotTenantPassword = async (req, res) => {
    const { tenantEmail } = req.body;

    try {
        const tenant = await Tenant.findOne({
            where: { tenantEmail }
        });

        if (!tenant) {
            return res.status(400).json({ success: false, message: "Tenant not found" });
        };

        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

        tenant.resetPasswordToken = resetToken;
        tenant.resetPasswordExpiresAt = resetTokenExpiresAt;
        await tenant.save();

        const subject = 'Password Reset Request';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #FB7C41; text-align: center;">Password Reset Request</h2>
              <p style="text-align: left;">We received a request to reset your password for your Hive tenant account.</p>
              <p style="text-align: left;">If you did not make this request, you can safely ignore this email.</p>
              <p style="text-align: left;">To reset your password, click the button below:</p>
              <div style="text-align: center; margin: 20px 0;">
                 <a href="${process.env.CLIENT_URL}/reset-password/${resetToken}" 
                    style="background-color: #B32C1A; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">
                    Reset Password
                 </a>
              </div>
              <p style="text-align: left; font-size: 0.9em; color: #555;">The link will expire in 1 hour for security reasons.</p>
              <br>
              <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A;">thehiveph2024@gmail.com</a>.
              </p>
           </div>
        `;
        
        await sendMail(tenantEmail, subject, null, html);

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
        const { token } = req.params;
        const { adminPassword } = req.body;

        const admin = await Admin.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpiresAt: {
                    [Op.gt]: new Date() 
                }
            }
        });

        if (!admin) {
            return res.status(400).json({
                success: false,
                message: "Reset password token expired or invalid",
            });
        }

        const hashedPassword = await bcryptjs.hash(adminPassword, 10);

        await admin.update({
            adminPassword: hashedPassword,
            resetPasswordToken: null,  
            resetPasswordExpiresAt: null 
        });

        const logMessage = `Admin ${admin.adminFirstName} ${admin.adminLastName} reset their password successfully.`;
        logActivity(admin.admin_id, 'password reset', logMessage);

        const subject = 'Password Reset Confirmation';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #FB7C41; text-align: center;">Password Reset Confirmation</h2>
              <p style="text-align: left;">We are writing to confirm that your password for your Hive admin account has been successfully reset.</p>
              <p style="text-align: left;">If you did not initiate this password reset, please contact our support team immediately at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A;">thehiveph2024@gmail.com</a>.</p>
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
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A;">thehiveph2024@gmail.com</a>.
              </p>
           </div>
        `;
        
        await sendMail(admin.adminEmail, subject, null, html);
        
        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message || "An unexpected error occurred.",
        });
    }
};

export const resetTenantPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { tenantPassword } = req.body;

        const tenant = await Tenant.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpiresAt: {
                    [Op.gt]: new Date() 
                }
            }
        });

        if (!tenant) {
            return res.status(400).json({
                success: false,
                message: "Reset password token expired or invalid",
            });
        }

        const hashedPassword = await bcryptjs.hash(tenantPassword, 10);

        await tenant.update({
            tenantPassword: hashedPassword,
            resetPasswordToken: null,  
            resetPasswordExpiresAt: null 
        });

        const logMessage = `Admin ${tenant.tenantFirstName} ${tenant.tenantLastName} reset their password successfully.`;

        logHistory(tenant.tenant_id, 'password reset', logMessage);

        const subject = 'Password Reset Confirmation';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #FB7C41; text-align: center;">Password Reset Confirmation</h2>
              <p style="text-align: left;">We are writing to confirm that your password for your Hive tenant account has been successfully reset.</p>
              <p style="text-align: left;">If you did not initiate this password reset, please contact our support team immediately at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A;">thehiveph2024@gmail.com</a> or your admin/s.</p>
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
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A;">thehiveph2024@gmail.com</a>.
              </p>
           </div>
        `;
        
        await sendMail(tenant.tenantEmail, subject, null, html);
        
        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message || "An unexpected error occurred.",
        });
    }
};

export const updateAdminPassword = async (req, res) => {
    const adminId = req.adminId;  
    const { currentPassword, newPassword } = req.body;

    try {
        console.log("Admin ID from middleware:", adminId);  

        const admin = await Admin.findOne({ where: { admin_id: adminId } });

        if (!admin) {
            console.error("Admin not found for Admin ID:", adminId);  
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        const { adminFirstName } = admin;

        const isMatch = await bcryptjs.compare(currentPassword, admin.adminPassword);
        if (!isMatch) {
            console.error("Current password does not match for Admin ID:", adminId);  
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        const hashedPassword = await bcryptjs.hash(newPassword, 10);

        admin.adminPassword = hashedPassword;
        await admin.save();

        const successMessage = `Password successfully updated for ${adminFirstName} (Admin ID: ${adminId}).`;
        console.log(successMessage);

        try {
            console.log(`Logging activity for admin ID: ${adminId}`);
            logActivity(adminId, 'password reset', successMessage);
        } catch (logError) {
            console.error("Error logging activity:", logError);
        }

        const subject = 'Password Change Confirmation';
        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                <h2 style="color: #FB7C41; text-align: center;">Password Change Confirmation</h2>
                <p style="text-align: left;">We are writing to confirm that your password for your Hive admin account has been successfully updated.</p>
                <p style="text-align: left;">If you did not initiate this change, please contact our support team immediately at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A;">thehiveph2024@gmail.com</a>.</p>
                <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
                <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="font-size: 0.8em; color: #777; text-align: center;">
                   This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A;">thehiveph2024@gmail.com</a>.
                </p>
            </div>
        `;

        try {
            console.log(`Sending email to admin: ${admin.adminEmail}`);
            await sendMail(admin.adminEmail, subject, null, html);
        } catch (emailError) {
            console.error("Error sending email:", emailError);
        }

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

        const tenant = await Tenant.findOne({ where: { tenant_id: tenantId } });

        if (!tenant) {
            console.error("Tenant not found for Tenant ID:", tenantId); 
            return res.status(404).json({ success: false, message: "Tenant not found" });
        }

        const { tenantFirstName } = tenant;

        const isMatch = await bcryptjs.compare(currentPassword, tenant.tenantPassword);
        if (!isMatch) {
            console.error("Current password does not match for Tenant ID:", tenantId); 
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        const hashedPassword = await bcryptjs.hash(newPassword, 10);

        tenant.tenantPassword = hashedPassword;
        await tenant.save();

        const successMessage = `Password successfully updated for ${tenantFirstName} (Tenant ID: ${tenantId}).`;
        console.log(successMessage);
        logHistory(tenantId, 'password reset', successMessage);

        console.log("Password successfully updated for Tenant ID:", tenantId); 

        const subject = 'Password Change Confirmation';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #FB7C41; text-align: center;">Password Change Confirmation</h2>
              <p style="text-align: left;">We are writing to confirm that your password for your Hive tenant account has been successfully updated.</p>
              <p style="text-align: left;">If you did not initiate this change, please contact our support team immediately at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A;">thehiveph2024@gmail.com</a>.</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A;">thehiveph2024@gmail.com</a>.
              </p>
           </div>
        `;

        await sendMail(tenant.tenantEmail, subject, null, html);

        return res.redirect(`/tenant/resetPassword?success=true&message=Password+updated+successfully`);
    } catch (error) {
        console.error("Error in updateTenantPassword:", error);  
        return res.redirect(`/tenant/resetPassword?success=false&message=${encodeURIComponent(error.message)}`);
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

export const viewRequestsAdmin = async (req) => {
    const establishmentId = req.establishmentId;

    if (!establishmentId) {
        console.error('Establishment ID is undefined. Ensure the user is correctly associated with an establishment.');
        throw new Error('Establishment ID is missing');
    }

    try {
        const rows = await Request.findAll({
            where: { establishment_id: establishmentId,
                status: 'pending'
             },
            include: [
                {
                    model: Tenant,
                    attributes: ['tenantProfile', 'tenantFirstName', 'tenantLastName'],
                    include: [{
                        model: Room,
                        attributes: ['roomNumber'], 
                    }]
                }
            ],
            raw: true 
        });

        return rows.map(row => {
            console.log(row);  
            return {
                ...row,
                tenantProfile: row['tenant.tenantProfile'] || '/images/defaultUser.webp',
                tenantFirstName: row['tenant.tenantFirstName'] || 'Unknown',
                tenantLastName: row['tenant.tenantLastName'] || 'Unknown',
                tenantRoomNumber: row['tenant.room.roomNumber'] || '-',
            };
        });

    } catch (error) {
        console.error('Error fetching requests:', error);
        throw new Error('Error fetching requests');
    }
};

export const viewRegularRequests = async (req) => {
    const establishmentId = req.establishmentId;

    if (!establishmentId) {
        console.error('Establishment ID is undefined. Ensure the user is correctly associated with an establishment.');
        throw new Error('Establishment ID is missing');
    }

    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);  
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(startOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);  
        endOfMonth.setHours(23, 59, 59, 999);

        const rows = await Request.findAll({
            where: {
                establishment_id: establishmentId,
                visitType: 'regular',
                visitDateFrom: {
                    [Sequelize.Op.gte]: startOfMonth,  
                    [Sequelize.Op.lte]: endOfMonth,   
                },
            },
            include: [
                {
                    model: Tenant,
                    attributes: ['tenantProfile', 'tenantFirstName', 'tenantLastName'],
                    include: [{
                        model: Room,
                        attributes: ['roomNumber'], 
                    }]
                }
            ],
            raw: true 
        });

        const convertToManilaTime = (utcDate) => {
            const date = new Date(utcDate);
            
            date.setHours(date.getHours() + 8); 

            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Manila', 
            };
            
            return date.toLocaleString('en-US', options).replace(',', ' |');
        };

        return rows.map(row => {
            console.log(row);
            
            const visitDateFrom = convertToManilaTime(row.visitDateFrom);
            const visitDateTo = convertToManilaTime(row.visitDateTo);

            return {
                ...row,
                tenantProfile: row['tenant.tenantProfile'] || '/images/defaultUser.webp',
                tenantFirstName: row['tenant.tenantFirstName'] || 'Unknown',
                tenantLastName: row['tenant.tenantLastName'] || 'Unknown',
                tenantRoomNumber: row['tenant.room.roomNumber'] || '-',
                visitDate: visitDateFrom.split(' |')[0],  
                checkInTime: visitDateFrom.split(' |')[1],  
                checkOutTime: visitDateTo.split(' |')[1],  
            };
        });

    } catch (error) {
        console.error('Error fetching regular requests:', error);
        throw new Error('Error fetching regular requests');
    }
};

export const viewOvernightRequests = async (req) => {
    const establishmentId = req.establishmentId;

    if (!establishmentId) {
        console.error('Establishment ID is undefined. Ensure the user is correctly associated with an establishment.');
        throw new Error('Establishment ID is missing');
    }

    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);  
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(startOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);  
        endOfMonth.setHours(23, 59, 59, 999);

        const rows = await Request.findAll({
            where: {
                establishment_id: establishmentId,
                visitType: 'overnight',
                visitDateFrom: {
                    [Op.gte]: startOfMonth,  
                    [Op.lte]: endOfMonth,   
                },
            },
            include: [
                {
                    model: Tenant,
                    attributes: ['tenantProfile', 'tenantFirstName', 'tenantLastName'],
                    include: [{
                        model: Room,
                        attributes: ['roomNumber'], 
                    }]
                }
            ],
            raw: true 
        });

        const convertToManilaTime = (utcDate) => {
            const date = new Date(utcDate);
            
            date.setHours(date.getHours() + 8); 

            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Manila', 
            };
            
            return date.toLocaleString('en-US', options).replace(',', ' |');
        };

        return rows.map(row => {
            console.log(row);
            
            const visitDateFrom = convertToManilaTime(row.visitDateFrom);
            const visitDateTo = convertToManilaTime(row.visitDateTo);

            return {
                ...row,
                tenantProfile: row['tenant.tenantProfile'] || '/images/defaultUser.webp',
                tenantFirstName: row['tenant.tenantFirstName'] || 'Unknown',
                tenantLastName: row['tenant.tenantLastName'] || 'Unknown',
                tenantRoomNumber: row['tenant.room.roomNumber'] || '-',
                checkInDateTime: visitDateFrom,  
                checkOutDateTime: visitDateTo,     
            };
        });

    } catch (error) {
        console.error('Error fetching overnight requests:', error);
        throw new Error('Error fetching overnight requests');
    }
};

export const viewApprovedRequests = async (req) => {
    const establishmentId = req.establishmentId;

    if (!establishmentId) {
        console.error('Establishment ID is undefined. Ensure the user is correctly associated with an establishment.');
        throw new Error('Establishment ID is missing');
    }

    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(startOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const rows = await Request.findAll({
            where: {
                establishment_id: establishmentId,
                status: 'approved',
                visitDateFrom: {
                    [Op.gte]: startOfMonth,
                    [Op.lte]: endOfMonth,
                },
            },
            include: [
                {
                    model: Tenant,
                    attributes: ['tenantProfile', 'tenantFirstName', 'tenantLastName'],
                    include: [{
                        model: Room,
                        attributes: ['roomNumber'],
                    }]
                }
            ],
            raw: true
        });

        const convertToManilaTime = (utcDate) => {
            const date = new Date(utcDate);
            date.setHours(date.getHours() + 8);  
        
            const options = { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true, 
                timeZone: 'Asia/Manila' 
            };
        
            return date.toLocaleString('en-US', options);
        };
        
        const formatDateRange = (visitDateFrom, visitDateTo, visitType) => {
            const startDate = new Date(visitDateFrom);
            const endDate = new Date(visitDateTo);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
        
            if (visitType === 'overnight') {
                const startDateFormatted = startDate.toLocaleDateString('en-US', options);
                const endDateFormatted = endDate.toLocaleDateString('en-US', options);
                return `${startDateFormatted.split(' ')[0]} ${startDate.getDate()} - ${endDate.getDate()}, ${endDate.getFullYear()}`;
            } else {
                return startDate.toLocaleDateString('en-US', options);
            }
        };
        
        return rows.map(row => {
            const checkInTime = convertToManilaTime(row.visitDateFrom);
            const checkOutTime = convertToManilaTime(row.visitDateTo);
        
            const visitType = row.visitType || 'regular';  
            const dateRange = formatDateRange(row.visitDateFrom, row.visitDateTo, visitType);
        
            return {
                ...row,
                tenantProfile: row['tenant.tenantProfile'] || '/images/defaultUser.webp',
                tenantFirstName: row['tenant.tenantFirstName'] || 'Unknown',
                tenantLastName: row['tenant.tenantLastName'] || 'Unknown',
                tenantRoomNumber: row['tenant.room.roomNumber'] || '-',
                checkInDateTime: visitType === 'overnight' ? `${checkInTime} ─── ${checkOutTime}` : checkInTime,
                visitDate: dateRange,
            };
        });

    } catch (error) {
        console.error('Error fetching approved requests:', error);
        throw new Error('Error fetching approved requests');
    }
};

export const viewPendingFixes = async (req) => {
    const establishmentId = req.establishmentId;

    if (!establishmentId) {
        console.error('Establishment ID is undefined. Ensure the user is correctly associated with an establishment.');
        throw new Error('Establishment ID is missing');
    }

    try {
        const rows = await Fix.findAll({
            where: { establishment_id: establishmentId,
                status: 'status'
             },
            include: [
                {
                    model: Tenant,
                    attributes: ['tenantProfile', 'tenantFirstName', 'tenantLastName'],
                    include: [{
                        model: Room,
                        attributes: ['roomNumber'], 
                    }]
                }
            ],
            raw: true 
        });

        return rows.map(row => {
            console.log(row);  
            return {
                ...row,
                tenantProfile: row['tenant.tenantProfile'] || '/images/defaultUser.webp',
                tenantFirstName: row['tenant.tenantFirstName'] || 'Unknown',
                tenantLastName: row['tenant.tenantLastName'] || 'Unknown',
                tenantRoomNumber: row['tenant.room.roomNumber'] || '-',
                tenantContactNumber: row.contactNum || '-',
                tenantScheduledDate: row.scheduledDate || '-',
                tenantDescription: row.description || '-',
            };
        });

    } catch (error) {
        console.error('Error fetching fixes:', error);
        throw new Error('Error fetching fixes');
    }
};

export const viewFixesAdmin = async (req) => {
    const establishmentId = req.establishmentId;

    if (!establishmentId) {
        console.error('Establishment ID is undefined. Ensure the user is correctly associated with an establishment.');
        throw new Error('Establishment ID is missing');
    }

    try {
        const rows = await Fix.findAll({
            where: { establishment_id: establishmentId,
                status: ['pending', 'in progress']
             },
            include: [
                {
                    model: Tenant,
                    attributes: ['tenantProfile', 'tenantFirstName', 'tenantLastName'],
                    include: [{
                        model: Room,
                        attributes: ['roomNumber'], 
                    }]
                }
            ],
            raw: true 
        });

        return rows.map(row => {
            console.log(row);  
            return {
                ...row,
                tenantProfile: row['tenant.tenantProfile'] || '/images/defaultUser.webp',
                tenantFirstName: row['tenant.tenantFirstName'] || 'Unknown',
                tenantLastName: row['tenant.tenantLastName'] || 'Unknown',
                tenantRoomNumber: row['tenant.room.roomNumber'] || '-',
                tenantContactNumber: row.contactNum || '-',
                tenantScheduledDate: row.scheduledDate || '-',
                tenantDescription: row.description || '-',
            };
        });

    } catch (error) {
        console.error('Error fetching fixes:', error);
        throw new Error('Error fetching fixes');
    }
};

export const viewRequests = async (req) => {
    const establishmentId = req.establishmentId;

    if (!establishmentId) {
        console.error('Establishment ID is undefined. Ensure the user is correctly associated with an establishment.');
        throw new Error('Establishment ID is missing');
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); 
    const currentYear = currentDate.getFullYear();

    try {
        const requestCounts = await Request.findAll({
            where: {
                establishment_id: establishmentId,
                [Op.and]: [
                    {
                        visitDateFrom: {
                            [Op.gte]: new Date(currentYear, currentMonth, 1),  
                            [Op.lt]: new Date(currentYear, currentMonth + 1, 1), 
                        }
                    },
                    {
                        visitDateTo: {
                            [Op.gte]: new Date(currentYear, currentMonth, 1),  
                            [Op.lt]: new Date(currentYear, currentMonth + 1, 1), 
                        }
                    }
                ]
            },
            attributes: [
                'status',
                [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        const counts = {
            pending: 0,
            approved: 0,
            rejected: 0,
        };

        requestCounts.forEach(row => {
            if (row.status === 'pending') {
                counts.pending = parseInt(row.count, 10);
            } else if (row.status === 'approved') {
                counts.approved = parseInt(row.count, 10);
            } else if (row.status === 'rejected') {
                counts.rejected = parseInt(row.count, 10);
            }
        });

        const rows = await Request.findAll({
            where: {
                establishment_id: establishmentId,
                [Op.and]: [
                    {
                        visitDateFrom: {
                            [Op.gte]: new Date(currentYear, currentMonth, 1),  
                            [Op.lt]: new Date(currentYear, currentMonth + 1, 1), 
                        }
                    },
                    {
                        visitDateTo: {
                            [Op.gte]: new Date(currentYear, currentMonth, 1),  
                            [Op.lt]: new Date(currentYear, currentMonth + 1, 1), 
                        }
                    }
                ]
            },
            include: [
                {
                    model: Tenant,
                    attributes: ['tenantProfile', 'tenantFirstName', 'tenantLastName'],
                    include: [{
                        model: Room,
                        attributes: ['roomNumber'],
                    }]
                }
            ],
            raw: true
        });

        const data = rows.map(row => {
            return {
                ...row,
                tenantProfile: row['tenant.tenantProfile'] || '/images/defaultUser.webp',
                tenantFirstName: row['tenant.tenantFirstName'] || 'Unknown',
                tenantLastName: row['tenant.tenantLastName'] || 'Unknown',
                tenantRoomNumber: row['tenant.room.roomNumber'] || '-',
                tenantContactNumber: row.contactNum || '-',
                tenantScheduledDate: row.scheduledDate || '-',
                tenantDescription: row.description || '-',
            };
        });

        return { data, counts };

    } catch (error) {
        console.error('Error fetching requests:', error);
        throw new Error('Error fetching requests');
    }
};

export const viewFixes = async (req) => {
    const establishmentId = req.establishmentId;

    if (!establishmentId) {
        console.error('Establishment ID is undefined. Ensure the user is correctly associated with an establishment.');
        throw new Error('Establishment ID is missing');
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); 
    const currentYear = currentDate.getFullYear();

    try {
        const rows = await Fix.findAll({
            where: {
                establishment_id: establishmentId,
                [Op.and]: [
                    {
                        submissionDate: {
                            [Op.gte]: new Date(currentYear, currentMonth, 1),  
                            [Op.lt]: new Date(currentYear, currentMonth + 1, 1), 
                        }
                    },
                    {
                        scheduledDate: {
                            [Op.gte]: new Date(currentYear, currentMonth, 1),  
                            [Op.lt]: new Date(currentYear, currentMonth + 1, 1), 
                        }
                    }
                ]
            },
            include: [
                {
                    model: Tenant,
                    attributes: ['tenantProfile', 'tenantFirstName', 'tenantLastName'],
                    include: [{
                        model: Room,
                        attributes: ['roomNumber'], 
                    }]
                }
            ],
            raw: true 
        });

        return rows.map(row => {
            console.log(row);  
            return {
                ...row,
                tenantProfile: row['tenant.tenantProfile'] || '/images/defaultUser.webp',
                tenantFirstName: row['tenant.tenantFirstName'] || 'Unknown',
                tenantLastName: row['tenant.tenantLastName'] || 'Unknown',
                tenantRoomNumber: row['tenant.room.roomNumber'] || '-',
                tenantContactNumber: row.contactNum || '-',
                tenantScheduledDate: row.scheduledDate || '-',
                tenantDescription: row.description || '-',
            };
        });

    } catch (error) {
        console.error('Error fetching fixes:', error);
        throw new Error('Error fetching fixes');
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

export const viewVisitorsTenant = async (req, res) => {
    const tenantId = req.tenantId;

    if (!tenantId) {
        return res.status(400).json({
            success: false,
            message: 'Tenant ID is required',
        });
    }

    const connection = connectDB();

    try {
        const query = `
            SELECT * 
            FROM Requests 
            WHERE tenant_id = ? 
              AND establishment_id = (
                SELECT establishment_id 
                FROM tenants 
                WHERE tenant_id = ?
              )
            ORDER BY requestDate ASC
        `;

        const [results] = await connection.promise().query(query, [tenantId, tenantId]);

        if (!results.length) {
            return res.json({
                success: true,
                message: 'No visitors found for this tenant.',
                visitors: [],
            });
        }

        return res.json({
            success: true,
            visitors: results,
        });
    } catch (error) {
        console.error('Error fetching tenant visitors log:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    } finally {
        connection.end();
    }
};

export const viewVisitorsAdmin = async (req, res) => {
    const establishmentId = req.establishmentId;

    if (!establishmentId) {
        return res.status(400).json({
            success: false,
            message: 'Establishment ID is required',
        });
    }

    const connection = connectDB();

    try {
        const query = 'SELECT * FROM Requests WHERE establishment_id = ? ORDER BY requestDate ASC';
        const [results] = await connection.promise().query(query, [establishmentId]);

        if (!results.length) {
            return res.json({
                success: true,
                message: 'No visitors found for this establishment.',
                visitors: [],
            });
        }

        return res.json({
            success: true,
            visitors: results,
        });
    } catch (error) {
        console.error('Error fetching admin visitors log:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    } finally {
        connection.end();
    }
};

export const viewActivities = async (req, res) => {
    const adminId = req.params.adminId;
    const { page = 1, limit = 10 } = req.query;  

    if (!adminId) {
        return res.status(400).json({ success: false, message: 'Admin ID is required.' });
    }

    const connection = connectDB(); 

    try {
        const offset = (page - 1) * limit;

        const countQuery = 'SELECT COUNT(*) AS totalCount FROM Activities WHERE admin_id = ?';
        const [countResult] = await connection.promise().query(countQuery, [adminId]);
        const totalCount = countResult[0].totalCount;

        const query = 'SELECT * FROM Activities WHERE admin_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?';
        const [results] = await connection.promise().query(query, [adminId, limit, offset]);

        if (!results.length) {
            return res.json({ success: true, message: 'No activities found for this admin.', activities: [], totalPages: 1 });
        }

        const totalPages = Math.ceil(totalCount / limit);

        return res.json({ success: true, activities: results, totalPages });
    } catch (error) {
        console.error('Error fetching activity log:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
        connection.end(); 
    }
};

export const viewHistories = async (req, res) => {
    const tenantId = req.tenantId;   
    const { page = 1, limit = 10 } = req.query;

    if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant ID is required.' });
    }

    const connection = connectDB();

    try {
        const offset = (page - 1) * limit;

        const countQuery = 'SELECT COUNT(*) AS totalCount FROM Histories WHERE tenant_id = ?';
        const [countResult] = await connection.promise().query(countQuery, [tenantId]);
        const totalCount = countResult[0].totalCount;

        const query = 'SELECT * FROM Histories WHERE tenant_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?';
        const [results] = await connection.promise().query(query, [tenantId, limit, offset]);

        if (!results.length) {
            return res.json({ success: true, message: 'No activities found for this tenant.', activities: [], totalPages: 1 });
        }

        const totalPages = Math.ceil(totalCount / limit);

        return res.json({ success: true, activities: results, totalPages });
    } catch (error) {
        console.error('Error fetching tenant activity log:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
        connection.end();
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

export const searchUtils = async (req, res, next) => {
    try {
      const searchTerm = req.query.q?.trim() || '';
      console.log('Search Term:', searchTerm);
  
      // Extract token from headers or cookies
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized. No token provided.' });
      }
  
      // Verify the token
      try {
        jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully.');
      } catch (err) {
        console.error('Token verification error:', err);
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      }
  
      // Set up query conditions
      const whereConditions = {};
      if (searchTerm) {
        whereConditions[Op.or] = [
          { roomNumber: { [Op.like]: `%${searchTerm}%` } },
          { roomType: { [Op.like]: `%${searchTerm}%` } },
        ];
      }
  
      // Fetch utilities based on the search term
      const utilities = await Utility.findAll({ where: whereConditions });
  
      return res.json({
        success: true,
        utilities: utilities || [], // Return an empty array if no results found
      });
    } catch (error) {
      console.error('Error executing searchUtils query:', error);
      return res.status(500).json({ success: false, message: 'Database query failed.' });
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

export const viewUtilities = async (req) => {
    try {
        const establishmentId = req.establishmentId;
        const { roomId, utilityType } = req.query || {}; 

        const conditions = { establishment_id: establishmentId };
        if (roomId) {
            conditions.room_id = roomId;
        }
        if (utilityType) {
            conditions[Op.and] = Sequelize.where(
                Sequelize.fn('LOWER', Sequelize.col('utilityType')),
                'LIKE',
                `%${utilityType.toLowerCase()}%`
            );
        }

        const rows = await Utility.findAll({
            where: conditions,
            include: {
                model: Room,
                attributes: ['roomNumber', 'roomType', 'floorNumber'],
            },
        });

        if (!rows || rows.length === 0) {
            return []; 
        }

        return rows.map(row => {
            const utility = row.get({ plain: true });
            return {
                utility_id: utility.utility_id,
                utilityType: utility.utilityType,
                charge: utility.charge,
                statementDate: utility.statementDate,
                dueDate: utility.dueDate,
                status: utility.status,
                perTenant: utility.perTenant,
                totalBalance: utility.totalBalance,
                sharedBalance: utility.sharedBalance,
                month: utility.month,
                room_id: utility.room_id,
                roomNumber: utility.Room?.roomNumber,
                roomType: utility.Room?.roomType,
                floorNumber: utility.Room?.floorNumber,
            };
        });
    } catch (error) {
        console.error('Error fetching utilities:', error);
        throw error;
    }
};

export const utilityHistories = async (req, res) => {
    try {
        const establishmentId = req.establishmentId;
        const { roomId } = req.query || {}; 

        const conditions = { establishment_id: establishmentId };
        if (roomId) {
            conditions.room_id = roomId;
        }

        const rows = await Utility.findAll({
            where: conditions,
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('statementDate'), '%Y-%m'), 'month'], 
                'totalBalance',
                'sharedBalance',
                'room_id',
            ],
            include: {
                model: Room,
                attributes: ['roomNumber', 'roomType', 'floorNumber'],
            },
            group: [
                Sequelize.fn('DATE_FORMAT', Sequelize.col('statementDate'), '%Y-%m'), 
                'room_id',
            ],
            order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('statementDate'), '%Y-%m'), 'DESC']], 
        });

        if (!rows || rows.length === 0) {
            return []; 
        }

        const utilitiesPerMonth = [];
        const seenMonths = new Set();

        rows.forEach(row => {
            const utility = row.get({ plain: true });

            const month = utility.month;
            if (!seenMonths.has(month)) {
                seenMonths.add(month);  

                utilitiesPerMonth.push({
                    month: utility.month,
                    totalBalance: parseFloat(utility.totalBalance).toFixed(2),  
                    sharedBalance: parseFloat(utility.sharedBalance).toFixed(2),  
                    room_id: utility.room_id,
                    roomNumber: utility.Room?.roomNumber, 
                    roomType: utility.Room?.roomType,
                    floorNumber: utility.Room?.floorNumber,
                });
            }
        });

        return utilitiesPerMonth;  
    } catch (error) {
        console.error('Error fetching utility histories:', error);
        return [];  
    }
};

export const addUtility = async (req, res) => {
    const { utilityType, charge, statementDate, dueDate, status, roomId } = req.body;

    if (!utilityType || !charge || !statementDate || !dueDate || !status || !roomId) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const parsedCharge = parseFloat(charge);
    if (isNaN(parsedCharge) || parsedCharge <= 0) {
        return res.status(400).json({ success: false, message: "Invalid charge value." });
    }

    try {
        console.log('Incoming request data:', req.body);

        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const establishmentId = decoded.establishmentId;
        const adminId = decoded.adminId;

        console.log('Decoded JWT:', decoded);

        const room = await Room.findOne({ where: { room_id: roomId, establishment_id: establishmentId } });
        if (!room) {
            return res.status(400).json({ success: false, message: "Room not found for this establishment." });
        }

        console.log('Querying Utilities for room:', {
            establishmentId,
            roomId,
            utilityType,
        });

        const statementMonthYear = new Date(statementDate);
        const month = statementMonthYear.toLocaleString('default', { month: 'long' });
        const year = statementMonthYear.getFullYear();

        const utilitiesForRoom = await Utility.findAll({
            where: {
                establishment_id: establishmentId,
                room_id: roomId,
                month: `${month} ${year}`, 
            }
        });

        console.log('Fetched utilities for room in month:', utilitiesForRoom);

        let totalBalance = 0;
        utilitiesForRoom.forEach((utility) => {
            totalBalance += parseFloat(utility.charge) || 0;
        });

        totalBalance += parsedCharge;  

        console.log('Total balance for the utilities in this month:', totalBalance);

        totalBalance = parseFloat(totalBalance.toFixed(2));

        const rooms = await Room.findAll({ where: { establishment_id: establishmentId } });
        const tenantCounts = await Promise.all(rooms.map(async (room) => {
            const tenantCountInRoom = await Tenant.count({ where: { room_id: room.room_id } });
            return tenantCountInRoom;
        }));

        console.log('Tenant counts:', tenantCounts);

        const totalTenants = tenantCounts.reduce((acc, count) => acc + count, 0);
        if (totalTenants === 0) {
            return res.status(400).json({ success: false, message: "No tenants found for this establishment." });
        }

        let perTenant = parsedCharge / totalTenants;
        perTenant = parseFloat(perTenant.toFixed(2));

        await Utility.update(
            {
                totalBalance,
                sharedBalance: 0, 
            },
            {
                where: {
                    establishment_id: establishmentId,
                    room_id: roomId,
                    month: `${month} ${year}`,  
                }
            });

        const newUtility = await Utility.create({
            utilityType,
            charge: parsedCharge,
            statementDate,
            dueDate,
            status,
            room_id: roomId,
            establishment_id: establishmentId,
            totalBalance,
            perTenant,
            sharedBalance: 0,
            month: `${month} ${year}`,  
        });

        logActivity(adminId, 'create', `Added new utility: ${utilityType} for Room ID: ${roomId}, Month: ${month} ${year}`);

        const utilitiesForRoomAfterUpdate = await Utility.findAll({
            where: {
                establishment_id: establishmentId,
                room_id: roomId,
                month: `${month} ${year}`, 
            }
        });

        let sharedBalance = 0;
        utilitiesForRoomAfterUpdate.forEach((utility) => {
            sharedBalance += parseFloat(utility.perTenant) || 0;
        });

        sharedBalance = parseFloat(sharedBalance.toFixed(2));

        await Utility.update(
            { sharedBalance },
            {
                where: {
                    establishment_id: establishmentId,
                    room_id: roomId,
                    month: `${month} ${year}`,   
                }
            });

        return res.status(201).json({ message: 'Utility added successfully!', utility: newUtility });
    } catch (error) {
        console.error('Error adding utility:', error);
        logActivity(decoded.adminId, 'error', errorMessage);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Failed to add utility', error: error.message });
        }
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

        logActivity(decoded.adminId, 'create', `Added tenant: ${tenantFirstName} ${tenantLastName}`);

        room.roomRemainingSlot -= 1;
        await room.save();

        generateTokenAndSetTenantCookie(res, newTenant.tenant_id, establishmentId);

        const subject = 'Account Creation Notification';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #FB7C41; text-align: center;">Account Creation Notification</h2>
              <p style="text-align: left;">We are writing to inform you that an account has been created for you under the establishment <strong>${establishment.eName}</strong>.</p> 
              <p style="text-align: left;">For your privacy and security, we strongly recommend that you update your password immediately after logging in.</p>
              <p style="text-align: left;">If you have any questions or did not expect this account creation, please contact our support team immediately at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A;">thehiveph2024@gmail.com</a>.</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A;">thehiveph2024@gmail.com</a>.
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

export const addMaintenance = async (req, res) => {
    try {
        const { type, description, urgency, scheduledDate, contactNum } = req.body;

        if (!type || !urgency || !contactNum) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const token = req.cookies.tenantToken;
        if (!token) {
            return res.status(400).json({ message: 'No token provided' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        console.log("Decoded token:", decoded); 

        const tenantId = decoded.tenantId;
        const tenant = await Tenant.findOne({ where: { tenant_id: tenantId }, include: Room });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        const establishmentId = tenant.establishmentId;
        console.log('Establishment ID from Tenant:', establishmentId);

        const roomId = tenant.room_id;
        const room = await Room.findOne({ where: { room_id: roomId } });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const newMaintenance = await Fix.create({
            type,
            description,
            urgency,
            scheduledDate,
            contactNum,
            tenant_id: tenantId,
            establishment_id: establishmentId,
            room_id: roomId,
        });

        logHistory(tenantId, 'create', `Tenant ${tenant.tenantFirstName} added a new fix request on ${scheduledDate} for ${type}`);

        const subject = 'Fix Request Received Confirmation';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
              <h2 style="color: #FB7C41; text-align: center; margin-bottom: 20px;">Fix Request Received</h2>
              <p style="text-align: left; font-size: 1.1em; margin-bottom: 10px;">Dear <strong>${tenant.tenantFirstName}</strong>,</p>
              <p style="text-align: left; font-size: 1em; margin-bottom: 10px;">We have received your request for a fix service. Please wait for a follow-up email when the service is in progress, along with the name of the assigned personnel.</p>
              
              <p style="text-align: left; font-size: 1em; margin-bottom: 20px;">We appreciate your patience during this process. You will receive another notification once the service begins.</p>
              
              <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>
              
              <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
              
              <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>
              
              <p style="font-size: 0.8em; color: #777; text-align: center;">
              This is an automated email. Please do not reply. For support, contact us at 
              <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A; text-decoration: none;">thehiveph2024@gmail.com</a>.
              </p>
            </div>
        `;

        try {
            await sendMail(tenant.tenantEmail, subject, null, html);
        } catch (error) {
            console.error("Error sending email:", error);
            return res.status(500).json({ message: 'Failed to send email' });
        }

        res.status(201).json({ message: 'Fix added successfully!', maintenance: newMaintenance });
    } catch (error) {
        console.error('Error adding fix:', error);
        res.status(500).json({ message: 'Failed to add fix', error: error.message });
    }
};

export const updateMaintenance = async (req, res) => {
    try {
      const adminId = req.adminId;
      const { maintenance_id } = req.params;
      const { assignedPerson, status } = req.body;

      const maintenance = await Fix.findOne({ where: { maintenance_id: maintenance_id } });

      if (!maintenance) {
        return res.status(404).json({ message: 'Maintenance not found' });
      }

      maintenance.assignedPerson = assignedPerson;
      maintenance.status = status;

      await maintenance.save();

      const tenant = await Tenant.findOne({ where: { tenant_id: maintenance.tenant_id } });

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      logActivity(adminId, 'update', `Admin ${adminId} assigned personnel to a maintenance request for ${tenant.tenantFirstName}.`);

      const subject = 'Fix Request Reviewed - Personnel Assigned';
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
          <h2 style="color: #FB7C41; text-align: center; margin-bottom: 20px;">Fix Request Reviewed - Personnel Assigned</h2>
          <p style="text-align: left; font-size: 1.1em; margin-bottom: 10px;">Dear <strong>${tenant.tenantFirstName}</strong>,</p>
          <p style="text-align: left; font-size: 1em; margin-bottom: 10px;">We would like to inform you that your fix request has been reviewed by the admin, and the following personnel has been assigned to handle the service:</p>
          <ul style="text-align: left; font-size: 1em; margin-bottom: 20px; padding-left: 20px;">
            <li><strong>Service Type:</strong> ${maintenance.type}</li>
            <li><strong>Scheduled Date:</strong> ${new Date(maintenance.scheduledDate).toLocaleDateString()}</li>
            <li><strong>Assigned Personnel:</strong> ${maintenance.assignedPerson}</li>
          </ul>

          <p style="text-align: left; font-size: 1em; margin-bottom: 10px;">The assigned personnel will contact you if further details are required before proceeding with the service. Please ensure that the area is accessible on the scheduled date for the team to complete the task.</p>
          <p style="text-align: left; font-size: 1em; margin-bottom: 20px; color: #FF5722;">
            <strong>Note:</strong> If you have any questions or concerns regarding this service, feel free to reach out to us at the contact provided below.
          </p>

          <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>

          <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
          <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>

          <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>

          <p style="font-size: 0.8em; color: #777; text-align: center;">
            This is an automated email. Please do not reply. For support, contact us at 
            <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A; text-decoration: none;">thehiveph2024@gmail.com</a>.
          </p>
        </div>
      `;

      try {
        await sendMail(tenant.tenantEmail, subject, null, html);
      } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: 'Failed to send email' });
      }

      res.status(200).json({
        message: 'Maintenance status updated successfully.',
        maintenance: {
          maintenance_id: maintenance.maintenance_id,
          assignedPerson: maintenance.assignedPerson,
          status: maintenance.status,
          tenantFirstName: tenant.tenantFirstName,
          tenantEmail: tenant.tenantEmail,
          type: maintenance.type,
          scheduledDate: maintenance.scheduledDate,
        },
      });
    } catch (error) {
      console.error('Error updating maintenance:', error);
      res.status(500).json({ message: 'Failed to update maintenance', error: error.message });
    }
};

export const doneMaintenance = async (req, res) => {
    try {
      const adminId = req.adminId; 
      const { maintenance_id } = req.params;  
      const currentDate = new Date();  
  
      const maintenance = await Fix.findOne({ where: { maintenance_id } });
  
      if (!maintenance) {
        return res.status(404).json({ message: 'Maintenance not found' });
      }

      maintenance.resolvedDate = currentDate;
      maintenance.status = 'completed';
  
      await maintenance.save();
  
      logActivity(adminId, 'update', `Admin ${adminId} marked the maintenance as done for ${maintenance.tenantFirstName}.`);
  
      const tenant = await Tenant.findOne({ where: { tenant_id: maintenance.tenant_id } });
      if (tenant) {
        const subject = 'Fix Request Resolved';
        const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
            <h2 style="color: #FB7C41; text-align: center; margin-bottom: 20px;">Fix Request Resolved</h2>
            <p style="text-align: left; font-size: 1.1em; margin-bottom: 10px;">Dear <strong>${tenant.tenantFirstName}</strong>,</p>
            <p style="text-align: left; font-size: 1em; margin-bottom: 10px;">We are happy to inform you that the fix request for ${maintenance.type} has been successfully resolved on ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}.</p>
            <p style="text-align: left; font-size: 1em; margin-bottom: 20px;">Thank you for your patience during the process. If you need further assistance, feel free to reach out.</p>
          
            <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>
            
            <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
            <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>

            <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>

            <p style="font-size: 0.8em; color: #777; text-align: center;">
              This is an automated email. Please do not reply. For support, contact us at 
              <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A; text-decoration: none;">thehiveph2024@gmail.com</a>.
            </p>
          </div>
        `;
  
        try {
          await sendMail(tenant.tenantEmail, subject, null, html);
        } catch (error) {
          console.error("Error sending email:", error);
          return res.status(500).json({ message: 'Failed to send email' });
        }
      }
  
      res.status(200).json({
        message: 'Maintenance marked as done successfully',
        maintenance,
      });
    } catch (error) {
      console.error('Error marking maintenance as done:', error);
      res.status(500).json({ message: 'Failed to mark maintenance as done', error: error.message });
    }
};
  
export const addRegularRequest = async (req, res) => {
    try {
        const { visitorName, contactInfo, purpose, visitDateFrom, visitDateTo, visitorAffiliation } = req.body;

        const token = req.cookies.tenantToken;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("Decoded token:", decoded); 

        const tenantId = decoded.tenantId;

        if (!tenantId) {
            return res.status(400).json({ message: 'Invalid token: missing tenant ID' });
        }

        const tenant = await Tenant.findOne({
            where: { tenant_id: tenantId },
            include: Room 
        });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        const establishmentId = tenant.establishmentId;
        console.log('Establishment ID from Tenant:', establishmentId);

        const roomId = tenant.room_id;

        const room = await Room.findOne({
            where: { room_id: roomId }
        });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const visitorLimit = room.visitorLimit || 0;  

        if (visitorLimit === 0) {
            return res.status(400).json({ message: 'This room does not accept visitors' });
        }

        const t = await sequelize.transaction();

        try {

            const visitDateFromManila = moment.utc(visitDateFrom).tz("Asia/Manila").format('YYYY-MM-DD HH:mm:ss');
            const visitDateToManila = moment.utc(visitDateTo).tz("Asia/Manila").format('YYYY-MM-DD HH:mm:ss');

            const newRequest = await Request.create({
                visitorName,
                contactInfo,
                purpose,
                visitDateFrom: visitDateFromManila,
                visitDateTo: visitDateToManila,
                visitorAffiliation,
                tenant_id: tenantId,
                establishment_id: establishmentId,
                room_id: roomId,
                status: "approved"
            }, { transaction: t });

            await t.commit();

            logHistory(tenantId, 'create', `Tenant ${tenant.tenantFirstName} added a new visit request on ${visitDateFrom} for ${visitorName}`);

            const subject = 'Visitor Request Received Confirmation';
            const html = `
               <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
                  <h2 style="color: #FB7C41; text-align: center; margin-bottom: 20px;">Visitor Request Approved</h2>
                  <p style="text-align: left; font-size: 1.1em; margin-bottom: 10px;">Dear <strong>${tenant.tenantFirstName}</strong>,</p>
                  <p style="text-align: left; font-size: 1em; margin-bottom: 10px;">We have approved your request for a visitor to come and see you. Below is an overview of the visitor details:</p>
               
                  <ul style="text-align: left; font-size: 1em; margin-bottom: 20px; padding-left: 20px;">
                     <li><strong>Visitor Name:</strong> ${visitorName}</li>
                     <li><strong>Contact Information:</strong> ${contactInfo}</li>
                     <li><strong>Visit Date (From):</strong> ${visitDateFrom}</li>
                     <li><strong>Visit Date (To):</strong> ${visitDateTo}</li>
                  </ul>
               
                  <p style="text-align: left; font-size: 1em; margin-bottom: 10px;">Please ensure that the visitor brings a valid ID for security checking upon entry.</p>
                  <p style="text-align: left; font-size: 1em; margin-bottom: 20px; color: #FF5722;">
                     <strong>Note:</strong> This approval is for a <strong>regular visit only</strong>. Overnight visit requests must be submitted at least a day before the visit date.
                  </p>
               
                  <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>
               
                  <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
                  <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
               
                  <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>
               
                  <p style="font-size: 0.8em; color: #777; text-align: center;">
                     This is an automated email. Please do not reply. For support, contact us at 
                     <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A; text-decoration: none;">thehiveph2024@gmail.com</a>.
                  </p>
               </div>
            `;

            try {
                await sendMail(tenant.tenantEmail, subject, null, html);
            } catch (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({ message: 'Failed to send email' });
            }

            res.status(201).json({ message: 'Request added successfully!', request: newRequest });
        } catch (error) {
            await t.rollback();
            console.error('Error adding request:', error);
            res.status(500).json({ message: 'Failed to add request', error: error.message });
        }
    } catch (error) {
        console.error('Error adding request:', error);
        res.status(500).json({ message: 'Failed to add request', error: error.message });
    }
};

export const addOvernightRequest = async (req, res) => {
    try {
        const { visitorName, contactInfo, purpose, visitDateFrom, visitDateTo, visitorAffiliation } = req.body;

        const token = req.cookies.tenantToken;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("Decoded token:", decoded); 

        const tenantId = decoded.tenantId;

        if (!tenantId) {
            return res.status(400).json({ message: 'Invalid token: missing tenant ID' });
        }

        const tenant = await Tenant.findOne({
            where: { tenant_id: tenantId },
            include: Room 
        });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        const establishmentId = tenant.establishmentId;
        console.log('Establishment ID from Tenant:', establishmentId);

        const roomId = tenant.room_id;

        const room = await Room.findOne({
            where: { room_id: roomId }
        });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const visitorLimit = room.visitorLimit || 0;  

        if (visitorLimit === 0) {
            return res.status(400).json({ message: 'This room does not accept visitors' });
        }

        const t = await sequelize.transaction();

        try {
            const visitDateFromManila = moment.utc(visitDateFrom).tz("Asia/Manila").format('YYYY-MM-DD HH:mm:ss');
            const visitDateToManila = moment.utc(visitDateTo).tz("Asia/Manila").format('YYYY-MM-DD HH:mm:ss');

            const newRequest = await Request.create({
                visitorName,
                contactInfo,
                purpose,
                visitDateFrom: visitDateFromManila,
                visitDateTo: visitDateToManila,
                visitorAffiliation,
                tenant_id: tenantId,
                establishment_id: establishmentId,
                room_id: roomId,
                visitType: "overnight",
            }, { transaction: t });

            await Room.update(
                { requestCount: sequelize.literal('requestCount + 1') },
                { where: { room_id: roomId }, transaction: t }
            );

            await t.commit();

            logHistory(tenantId, 'create', `Tenant ${tenant.tenantFirstName} added a new visit request on ${visitDateFrom} for ${visitorName}`);

            const subject = 'Overnight Visitor Request Received Confirmation';
            const html = `
               <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
                  <h2 style="color: #FB7C41; text-align: center; margin-bottom: 20px;">Overnight Visitor Request Received</h2>
                  <p style="text-align: left; font-size: 1.1em; margin-bottom: 10px;">Dear <strong>${tenant.tenantFirstName}</strong>,</p>
                  <p style="text-align: left; font-size: 1em; margin-bottom: 10px;">We have received your request for an overnight visitor to stay. Your request is currently under review by our admin team. Below is a summary of the details you provided:</p>
               
                  <ul style="text-align: left; font-size: 1em; margin-bottom: 20px; padding-left: 20px;">
                     <li><strong>Visitor Name:</strong> ${visitorName}</li>
                     <li><strong>Contact Information:</strong> ${contactInfo}</li>
                     <li><strong>Visit Date (From):</strong> ${visitDateFrom}</li>
                     <li><strong>Visit Date (To):</strong> ${visitDateTo}</li>
                  </ul>
               
                  <p style="text-align: left; font-size: 1em; margin-bottom: 10px;">Please wait for the admin's approval. Once a decision has been made, you will receive another email with further instructions.</p>
                  <p style="text-align: left; font-size: 1em; margin-bottom: 20px; color: #FF5722;">
                     <strong>Urgent Request:</strong> If your request is urgent, please contact the admin directly for expedited processing.
                  </p>
               
                  <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>
               
                  <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
                  <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
               
                  <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>
               
                  <p style="font-size: 0.8em; color: #777; text-align: center;">
                     This is an automated email. Please do not reply. For support, contact us at 
                     <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A; text-decoration: none;">thehiveph2024@gmail.com</a>.
                  </p>
               </div>
            `;

            try {
                await sendMail(tenant.tenantEmail, subject, null, html);
            } catch (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({ message: 'Failed to send email' });
            }

            res.status(201).json({ message: 'Request added successfully!', request: newRequest });
        } catch (error) {
            await t.rollback();
            console.error('Error adding request:', error);
            res.status(500).json({ message: 'Failed to add request', error: error.message });
        }
    } catch (error) {
        console.error('Error adding request:', error);
        res.status(500).json({ message: 'Failed to add request', error: error.message });
    }
};

export const cancelRequest = async (req, res) => {
    try {
        const tenantId = req.tenantId; 
        const { requestId } = req.params; 

        const request = await Request.findOne({
            where: { request_id: requestId },
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const { visitorName, visitDate, room_id } = request;

        const tenant = await Tenant.findOne({
            where: { tenant_id: tenantId },
            attributes: ['tenantFirstName', 'tenantEmail'], 
        });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        const { tenantFirstName, tenantEmail } = tenant; 

        request.status = 'cancelled';
        await request.save();

        logHistory(tenantId, 'delete', `Tenant ${tenantId} cancelled a visit request on ${visitDate} for ${visitorName}`);

        if (room_id) {
            await Room.update(
                { requestCount: sequelize.literal('requestCount - 1') }, 
                { where: { room_id: room_id } }
            );
        }

        const subject = 'Visitor Entry Cancellation Confirmation';
        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
                <h2 style="color: #FB7C41; text-align: center; margin-bottom: 20px;">Visitor Entry Cancellation Request Received</h2>
                <p style="text-align: left; font-size: 1.1em; margin-bottom: 10px;">Dear <strong>${tenantFirstName}</strong>,</p>
                <p style="text-align: left; font-size: 1em; margin-bottom: 10px;">We have received your request to cancel the visitor entry for <strong>${visitorName}</strong> scheduled for <strong>${visitDate}</strong>.</p>
                <p style="text-align: left; font-size: 1em; margin-bottom: 20px;">Your request is currently being reviewed. If you have made this cancellation by mistake or wish to undo it, please reach out to your admin immediately for assistance.</p>
                
                <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>
                
                <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
                <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
                
                <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>
                
                <p style="font-size: 0.8em; color: #777; text-align: center;">
                   This is an automated email. Please do not reply. For support, contact us at 
                   <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A; text-decoration: none;">thehiveph2024@gmail.com</a>.
                </p>
            </div>
        `;
        
        try {
            await sendMail(tenantEmail, subject, null, html);
        } catch (error) {
            console.error("Error sending email:", error);
            return res.status(500).json({ message: 'Failed to send email' });
        }

        res.status(200).json({ message: 'Request cancelled successfully!', request });
    } catch (error) {
        console.error('Error cancelling request:', error);
        res.status(500).json({ message: 'Failed to cancel request', error: error.message });
    }
};

export const approvedRequest = async (req, res) => {
    try {
      const adminId = req.adminId;
      const { requestId } = req.params;
      const { adminComments } = req.body;
  
      const request = await Request.findOne({ where: { request_id: requestId } });
  
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
  
      const room = await Room.findOne({ where: { room_id: request.room_id } });
  
      if (!room) {
        return res.status(404).json({ message: 'Associated room not found' });
      }
  
      if (room.visitorLimit <= 0) {
        return res.status(400).json({ message: 'Visitor limit reached for this room' });
      }
  
      room.requestCount = Math.max(0, room.requestCount - 1);
  
      request.status = 'approved';
      request.adminComments = adminComments || request.adminComments;
      request.decisionTimestamp = new Date();
  
      await request.save();
      await room.save();
  
      const tenant = await Tenant.findOne({ where: { tenant_id: request.tenant_id } });
  
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
  
      logActivity(adminId, 'update', `Admin ${adminId} approved a visitor entry from ${tenant.tenantFirstName}.`);
  
      const subject = 'Overnight Visitor Request Approved';
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
          <h2 style="color: #FB7C41; text-align: center; margin-bottom: 20px;">Overnight Visitor Request Approved</h2>
          <p style="text-align: left; font-size: 1.1em; margin-bottom: 10px;">Dear <strong>${tenant.tenantFirstName}</strong>,</p>
          <p style="text-align: left; font-size: 1em; margin-bottom: 10px;">We are pleased to inform you that your overnight visitor request has been approved. Below is an overview of the visitor details:</p>
          <ul style="text-align: left; font-size: 1em; margin-bottom: 20px; padding-left: 20px;">
            <li><strong>Visitor Name:</strong> ${request.visitorName}</li>
            <li><strong>Contact Information:</strong> ${request.contactInfo || 'Not provided'}</li>
            <li><strong>Purpose:</strong> ${request.purpose || 'Not specified'}</li>
            <li><strong>Visit Date (From):</strong> ${new Date(request.visitDateFrom).toLocaleDateString()}</li>
            <li><strong>Visit Date (To):</strong> ${new Date(request.visitDateTo).toLocaleDateString()}</li>
          </ul>

          <p style="text-align: left; font-size: 1em; margin-bottom: 10px;">Please ensure that the visitor brings a valid ID for security checking upon entry. Overnight visitors are required to comply with all property rules and regulations during their stay.</p>
          <p style="text-align: left; font-size: 1em; margin-bottom: 10px; color: #FF5722;">
            <strong>Note:</strong> Overnight visit approvals are subject to the property’s overnight policies. Any extensions beyond the approved dates must be requested separately and will require additional approval.
          </p>
          <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>
          <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
          <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
          <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>
          <p style="font-size: 0.8em; color: #777; text-align: center;">This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A; text-decoration: none;">thehiveph2024@gmail.com</a>.</p>
        </div>
      `;
  
      try {
        await sendMail(tenant.tenantEmail, subject, null, html);
      } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: 'Failed to send email' });
      }
  
      res.status(200).json({
        message: 'Request status updated to approved',
        request: request,
      });
    } catch (error) {
      console.error('Error approving request:', error);
      res.status(500).json({ message: 'Failed to approve request', error: error.message });
    }
};
  
export const rejectedRequest = async (req, res) => {
    try {
      const adminId = req.adminId;
      const { requestId } = req.params;
      const { adminComments } = req.body;
  
      const request = await Request.findOne({ where: { request_id: requestId } });
  
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
  
      const room = await Room.findOne({ where: { room_id: request.room_id } });
  
      if (!room) {
        return res.status(404).json({ message: 'Associated room not found' });
      }
  
      room.requestCount = Math.max(0, room.requestCount - 1);
  
      request.status = 'rejected';
      request.adminComments = adminComments || 'No specific reason provided.';
      request.decisionTimestamp = new Date();
  
      await request.save();
      await room.save();
  
      const tenant = await Tenant.findOne({ where: { tenant_id: request.tenant_id } });
  
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
  
      logActivity(adminId, 'update', `Admin ${adminId} rejected an overnight visitor entry from ${tenant.tenantFirstName}.`);
  
      const subject = 'Overnight Visitor Request Rejected';
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
          <h2 style="color: #F44336; text-align: center; margin-bottom: 20px;">Overnight Visitor Request Rejected</h2>
          <p style="text-align: left; font-size: 1.1em; margin-bottom: 10px;">Dear <strong>${tenant.tenantFirstName}</strong>,</p>
          <p style="text-align: left; font-size: 1em; margin-bottom: 10px;">We regret to inform you that your overnight visitor request has been rejected. Below is an overview of the visitor details:</p>
  
          <ul style="text-align: left; font-size: 1em; margin-bottom: 20px; padding-left: 20px;">
              <li><strong>Visitor Name:</strong> ${request.visitorName}</li>
              <li><strong>Contact Information:</strong> ${request.contactInfo}</li>
              <li><strong>Visit Date (From):</strong> ${new Date(request.visitDateFrom).toLocaleDateString()}</li>
              <li><strong>Visit Date (To):</strong> ${new Date(request.visitDateTo).toLocaleDateString()}</li>
          </ul>
  
          <p style="text-align: left; font-size: 1em; margin-bottom: 10px;"><strong>Reason for Rejection:</strong> ${request.adminComments}</p>
  
          <p style="text-align: left; font-size: 1em; margin-bottom: 20px; color: #FF5722;">
              <strong>Note:</strong> Overnight visit approvals are subject to the property’s overnight policies. Any extensions beyond the approved dates must be requested separately and will require additional approval.
          </p>
  
          <p style="text-align: left; font-size: 1em; margin-bottom: 20px; color: #FF5722;">
              <strong>If you wish to dispute this decision, please do not hesitate to contact the admin.</strong>
          </p>
  
          <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>
          
          <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
          <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
          
          <div style="border-top: 1px solid #ddd; margin: 20px 0;"></div>
          
          <p style="font-size: 0.8em; color: #777; text-align: center;">
              This is an automated email. Please do not reply. For support, contact us at 
              <a href="mailto:thehiveph2024@gmail.com" style="color: #B32C1A; text-decoration: none;">thehiveph2024@gmail.com</a>.
          </p>
        </div>
      `;
  
      try {
        await sendMail(tenant.tenantEmail, subject, null, html);
      } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: 'Failed to send email' });
      }
  
      res.status(200).json({
        message: 'Overnight visitor request status updated to rejected',
        request: request,
      });
    } catch (error) {
      console.error('Error rejecting overnight request:', error);
      res.status(500).json({ message: 'Failed to reject overnight request', error: error.message });
    }
};

export const checkin = async (req, res) => {
    try {
        const { requestId } = req.body; 

        if (!requestId) {
            return res.status(400).json({ message: 'Request ID is required' });
        }

        const request = await Request.findOne({
            where: { request_id: requestId },
            include: Room
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.checkin) {
            return res.status(400).json({ message: 'Visitor has already checked in' });
        }

        const room = request.Room; 
        if (room.visitorLimit <= 0) {
            return res.status(400).json({ message: 'No available spots left in this room' });
        }

        const t = await sequelize.transaction();

        try {
            await Room.update(
                { visitorLimit: sequelize.literal('visitorLimit - 1') },
                { where: { room_id: room.room_id }, transaction: t }
            );

            await Request.update(
                { checkin: true },
                { where: { request_id: requestId }, transaction: t }
            );

            await t.commit();

            logHistory(request.tenant_id, 'checkin', `Visitor ${request.visitorName} checked in for request ID: ${requestId}`);

            res.status(200).json({ message: 'Visitor checked in successfully', request });
        } catch (error) {
            await t.rollback();
            console.error('Error during checkin:', error);
            res.status(500).json({ message: 'Failed to check in visitor', error: error.message });
        }
    } catch (error) {
        console.error('Error during checkin process:', error);
        res.status(500).json({ message: 'Failed to process checkin', error: error.message });
    }
};

export const checkout = async (req, res) => {
    try {
        const { requestId } = req.body; 

        if (!requestId) {
            return res.status(400).json({ message: 'Request ID is required' });
        }

        const request = await Request.findOne({
            where: { request_id: requestId },
            include: Room
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (!request.checkin) {
            return res.status(400).json({ message: 'Visitor has not checked in yet' });
        }

        const room = request.Room; 

        const t = await sequelize.transaction();

        try {
            await Room.update(
                { visitorLimit: sequelize.literal('visitorLimit + 1') },
                { where: { room_id: room.room_id }, transaction: t }
            );

            await Request.update(
                { checkin: false },
                { where: { request_id: requestId }, transaction: t }
            );

            await t.commit();

            logHistory(request.tenant_id, 'checkout', `Visitor ${request.visitorName} checked out for request ID: ${requestId}`);

            res.status(200).json({ message: 'Visitor checked out successfully', request });
        } catch (error) {
            await t.rollback();
            console.error('Error during checkout:', error);
            res.status(500).json({ message: 'Failed to checkout visitor', error: error.message });
        }
    } catch (error) {
        console.error('Error during checkout process:', error);
        res.status(500).json({ message: 'Failed to process checkout', error: error.message });
    }
};

export const addUnit = async (req, res) => {
    try {
        const { roomNumber, roomType, roomTotalSlot, roomRemainingSlot, floorNumber, visitorLimit } = req.body;

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
            visitorLimit,
            originalVisitorLimit: visitorLimit,
            establishmentId
        });

        logActivity(decoded.adminId, 'create', `Added room ${roomNumber} on floor ${floorNumber}`);

        res.status(201).json({ message: 'Room added successfully!', room: newRoom });
    } catch (error) {
        console.error('Error adding room:', error);
        res.status(500).json({ message: 'Failed to add room', error: error.message });
    }
};

export const addFeedback = async (req, res) => {
    const adminId = req.adminId;

    try {
        const { userName, feedback, content } = req.body;

        const adminDetails = await Admin.findByPk(adminId); 
        if (!adminDetails || !adminDetails.adminEmail) {
            throw new Error('Admin email not found.');
        }

        const adminEmail = adminDetails.adminEmail;

        const newFeedback = await Feedback.create({
            userName: userName,
            tenant_id: null,
            admin_id: adminId,
            establishment_id: null,
            feedback_level: feedback,
            content: content,
        });

        logActivity(adminId, 'create', `Added feedback from ${userName}`);

        const subject = 'Feedback Received Confirmation';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #FB7C41; text-align: center;">Feedback Received</h2>
              <p style="text-align: left;">Dear <strong>${userName}</strong>,</p>
              <p style="text-align: left;">Thank you for sharing your feedback with us. We have received your comments and appreciate you taking the time to help us improve.</p>
              <p style="text-align: left;">Our team will review your feedback and take appropriate action as necessary.</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #4CAF50;">thehiveph2024@gmail.com</a>.
              </p>
           </div>
        `;

        await sendMail(adminEmail, subject, null, html);

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

export const addTenantFeedback = async (req, res) => {
    const tenantId = req.tenantId;

    try {
        const { userName, feedback, content } = req.body;

        const tenantDetails = await Tenant.findByPk(tenantId); 
        if (!tenantDetails || !tenantDetails.tenantEmail) {
            throw new Error('Tenant email not found.');
        }

        const tenantEmail = tenantDetails.tenantEmail;

        const newFeedback = await Feedback.create({
            userName: userName,
            tenant_id: tenantId,
            admin_id: null,
            establishment_id: null,
            feedback_level: feedback,
            content: content,
        });

        logHistory(tenantId, 'create', `Added feedback from ${userName}`);

        const subject = 'Feedback Received Confirmation';
        const html = `
           <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #4CAF50; text-align: center;">Feedback Received</h2>
              <p style="text-align: left;">Dear <strong>${userName}</strong>,</p>
              <p style="text-align: left;">Thank you for sharing your feedback with us. We have received your comments and appreciate you taking the time to help us improve.</p>
              <p style="text-align: left;">Our team will review your feedback and take appropriate action as necessary.</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;">Best regards,</p>
              <p style="font-size: 0.9em; color: #555; text-align: left;"><strong>Hive Team</strong></p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 0.8em; color: #777; text-align: center;">
                 This is an automated email. Please do not reply. For support, contact us at <a href="mailto:thehiveph2024@gmail.com" style="color: #4CAF50;">thehiveph2024@gmail.com</a>.
              </p>
           </div>
        `;

        await sendMail(tenantEmail, subject, null, html);

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

export const editUtility = async (req, res) => {
    const utilityId = req.params.utility_id;

    if (!utilityId) {
        return res.status(400).send('Utility ID is required');
    }

    try {
        const utility = await Utility.findOne({
            where: { utility_id: utilityId },
        });

        if (!utility) {
            return res.status(404).send('Utility not found');
        }

        res.render('editUtility', { utility });
    } catch (error) {
        console.error('Error fetching utility data:', error);
        res.status(500).send('Error fetching utility data');
    }
};


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

export const updateUtility = async (req, res) => {
    const { utilityType, charge, statementDate, dueDate, status } = req.body;
    const utilityId = req.params.utility_id;
    const adminId = req.adminId;

    if (!charge || isNaN(parseFloat(charge)) || parseFloat(charge) <= 0) {
        return res.status(400).json({ success: false, message: "Invalid charge value." });
    }

    const parsedCharge = parseFloat(charge);

    try {
        const connection = connectDB();

        const [utilityRows] = await connection.promise().query(
            'SELECT * FROM Utilities WHERE utility_id = ?',
            [utilityId]
        );

        if (utilityRows.length === 0) {
            connection.end();
            return res.status(404).json({ success: false, message: "Utility not found." });
        }

        const utility = utilityRows[0];

        const updatedUtilityData = {
            charge: parsedCharge,
            utilityType: utilityType || utility.utilityType,
            statementDate: statementDate || utility.statementDate,
            dueDate: dueDate || utility.dueDate,
            status: status || utility.status,
        };

        const [updateUtilityResult] = await connection.promise().query(
            'UPDATE Utilities SET charge = ?, utilityType = ?, statementDate = ?, dueDate = ?, status = ? WHERE utility_id = ?',
            [
                updatedUtilityData.charge,
                updatedUtilityData.utilityType,
                updatedUtilityData.statementDate,
                updatedUtilityData.dueDate,
                updatedUtilityData.status,
                utilityId
            ]
        );

        if (updateUtilityResult.affectedRows === 0) {
            connection.end();
            return res.status(500).json({ success: false, message: "Failed to update utility." });
        }

        console.log(`Updated Utility ID ${utility.utility_id} with new charge and dates.`);

        logActivity(adminId, 'update', `Updated utility: ${updatedUtilityData.utilityType} for Room ID ${utility.room_id} with new charge and dates for Utility ID ${utilityId}`);


        const [utilitiesForRoomRows] = await connection.promise().query(
            'SELECT * FROM Utilities WHERE establishment_id = ? AND room_id = ? AND YEAR(statementDate) = YEAR(CURRENT_DATE()) AND MONTH(statementDate) = MONTH(CURRENT_DATE())',
            [utility.establishment_id, utility.room_id]
        );

        let totalBalance = 0;
        utilitiesForRoomRows.forEach((u) => {
            totalBalance += parseFloat(u.charge || 0);
        });

        console.log('Total Balance after update:', totalBalance);

        const [rooms] = await connection.promise().query(
            'SELECT * FROM Rooms WHERE establishment_id = ?',
            [utility.establishment_id]
        );

        const tenantCounts = await Promise.all(
            rooms.map(async (room) => {
                const [tenantCount] = await connection.promise().query(
                    'SELECT COUNT(*) AS tenant_count FROM Tenants WHERE room_id = ?',
                    [room.room_id]
                );
                return tenantCount[0].tenant_count;
            })
        );

        const totalTenants = tenantCounts.reduce((acc, count) => acc + count, 0);

        if (totalTenants === 0) {
            connection.end();
            return res.status(400).json({ success: false, message: "No tenants found in the establishment." });
        }

        const updatedUtilities = await Promise.all(
            utilitiesForRoomRows.map(async (u) => {
                const perTenant = parseFloat((u.charge / totalTenants).toFixed(2));
                const [updateUtility] = await connection.promise().query(
                    'UPDATE Utilities SET totalBalance = ?, perTenant = ? WHERE utility_id = ?',
                    [totalBalance, perTenant, u.utility_id]
                );
                console.log(`Updated Utility ID ${u.utility_id} with Per Tenant: ${perTenant}`);
                return { ...u, perTenant };
            })
        );

        const sharedBalance = updatedUtilities.reduce((sum, u) => sum + (u.perTenant || 0), 0);
        const sharedBalanceFixed = parseFloat(sharedBalance.toFixed(2));

        await Promise.all(
            updatedUtilities.map(async (u) => {
                const [updateSharedBalance] = await connection.promise().query(
                    'UPDATE Utilities SET sharedBalance = ? WHERE utility_id = ?',
                    [sharedBalanceFixed, u.utility_id]
                );
                console.log(`Updated Utility ID ${u.utility_id} with Shared Balance: ${sharedBalanceFixed}`);
            })
        );

        connection.end();

        return res.json({
            success: true,
            message: "Utility updated successfully.",
            utility: updatedUtilityData,
        });
    } catch (error) {
        console.error('Error updating utility:', error);
        return res.status(500).json({
            success: false,
            message: "Error updating utility data",
            error: error.message,
        });
    }
};


export const updateTenant = async (req, res) => {
    const { tenantFirstName, tenantLastName, tenantEmail, mobileNum, gender, tenantGuardianName, tenantAddress, tenantGuardianNum } = req.body;
    const tenantId = req.params.tenantId;

    let establishmentId;
    let adminId;

    try {
        const token = req.cookies.token; 
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        establishmentId = decoded.establishmentId;
        adminId = decoded.adminId;
        console.log('Decoded JWT Token:', decoded); 

    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }

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

            logActivity(adminId, 'update', `Updated tenant ID ${tenantId}: ${tenantFirstName} ${tenantLastName}.`);

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
    console.log('Admin ID received by backend:', adminId); 

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

        await logActivity(adminId, 'delete', `Deleted admin account ID ${adminId}.`);

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
    const adminId = req.adminId;

    if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant ID is required' });
    }

    try {
        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        const tenantName = `${tenant.tenantFirstName} ${tenant.tenantLastName}`;

        const room = await Room.findByPk(tenant.room_id);  
        if (room) {
            room.roomRemainingSlot += 1;
            await room.save();  
            console.log('Updated roomRemainingSlot:', room.roomRemainingSlot);
        }

        await tenant.destroy();
        logActivity(adminId, 'delete', `Deleted tenant ${tenantName} (ID: ${tenantId}). Tenant was assigned to room ID ${tenant.room_id}.`);
        return res.status(200).json({ success: true, message: 'Tenant deleted successfully' });
    } catch (error) {
        console.error('Error deleting tenant:', error);
        logActivity(adminId, 'error', `Failed to delete tenant ID ${tenantId}. Error: ${error.message}`);
        return res.status(500).json({ success: false, message: 'An error occurred while deleting the tenant' });
    }
};

export const deleteUnit = (req, res) => {
    const roomId = req.params.room_id;
    const connection = connectDB();
    const adminId = req.adminId;

    connection.query('SELECT * FROM Rooms WHERE room_id = ?', [roomId], (err, rows) => {
        if (err) {
            connection.end();
            console.error('Error retrieving room details:', err);
            return res.status(500).json({ success: false, message: "Error retrieving room details" });
        }

        if (rows.length === 0) {
            connection.end();
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        const room = rows[0];  
        const roomName = room.roomNumber; 

        connection.query('DELETE FROM Rooms WHERE room_id = ?', [roomId], (err, result) => {
            connection.end();

            if (err) {
                console.error('Error deleting room data:', err);
                return res.status(500).json({ success: false, message: "Error deleting room data" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Room not found" });
            }

            logActivity(adminId, 'delete', `Admin ID ${adminId} deleted room ID ${roomName}.`);

            res.json({ success: true, message: "Room successfully removed" });
        });
    });
};


export const deleteUtility = async (req, res) => {
    const utilityId = req.params.utility_id;
    const connection = connectDB();
    const adminId = req.adminId;

    try {
        const [utilityRows] = await connection.promise().query(
            'SELECT charge, room_id, establishment_id, statementDate FROM Utilities WHERE utility_id = ?',
            [utilityId]
        );

        if (utilityRows.length === 0) {
            connection.end();
            return res.status(404).json({ success: false, message: "Utility not found" });
        }

        const utilityToDelete = utilityRows[0];
        const { charge, room_id, establishment_id, statementDate } = utilityToDelete;

        const [utilitiesForRoomRows] = await connection.promise().query(
            'SELECT * FROM Utilities WHERE establishment_id = ? AND room_id = ? AND YEAR(statementDate) = YEAR(CURRENT_DATE()) AND MONTH(statementDate) = MONTH(CURRENT_DATE())',
            [establishment_id, room_id]
        );

        let totalBalance = 0;
        utilitiesForRoomRows.forEach((u) => {
            totalBalance += parseFloat(u.charge || 0);
        });

        totalBalance -= charge;

        const [rooms] = await connection.promise().query(
            'SELECT * FROM Rooms WHERE establishment_id = ?',
            [establishment_id]
        );

        const tenantCounts = await Promise.all(
            rooms.map(async (room) => {
                const [tenantCount] = await connection.promise().query(
                    'SELECT COUNT(*) AS tenant_count FROM Tenants WHERE room_id = ?',
                    [room.room_id]
                );
                return tenantCount[0].tenant_count;
            })
        );

        const totalTenants = tenantCounts.reduce((acc, count) => acc + count, 0);

        if (totalTenants === 0) {
            connection.end();
            return res.status(400).json({ success: false, message: "No tenants found in the establishment." });
        }

        let sharedBalance = totalBalance / totalTenants;
        sharedBalance = parseFloat(sharedBalance.toFixed(2));

        const [updateUtilitiesResult] = await connection.promise().query(
            'UPDATE Utilities SET totalBalance = ?, sharedBalance = ? WHERE room_id = ? AND establishment_id = ? AND YEAR(statementDate) = YEAR(CURRENT_DATE()) AND MONTH(statementDate) = MONTH(CURRENT_DATE())',
            [totalBalance, sharedBalance, room_id, establishment_id]
        );

        const [deleteUtilityResult] = await connection.promise().query(
            'DELETE FROM Utilities WHERE utility_id = ?',
            [utilityId]
        );

        if (deleteUtilityResult.affectedRows === 0) {
            connection.end();
            return res.status(404).json({ success: false, message: "Utility not found" });
        }

        connection.end();

        logActivity(adminId, 'delete', `Admin ID ${adminId} deleted ${utilityType} (Utility ID: ${utilityId}).`);

        return res.json({
            success: true,
            message: "Utility successfully removed",
        });
    } catch (error) {
        console.error('Error deleting utility:', error);
        logActivity(adminId, 'delete_error', `Admin ID ${adminId} encountered an error while deleting utility ID ${utilityId}. Error: ${error.message}`);
        connection.end();
        return res.status(500).json({
            success: false,
            message: "Error deleting utility data",
            error: error.message,
        });
    }
};

export const getOccupiedUnits = async (req, res) => {
    const establishmentId = req.establishmentId;

    try {
        const rooms = await Room.findAll({
            where: { establishmentId },
            raw: true, 
        });

        const occupiedUnits = rooms.reduce((count, room) => {
            return count + (room.roomRemainingSlot < room.roomTotalSlot ? 1 : 0);
        }, 0);

        return occupiedUnits;

    } catch (error) {
        console.error("Error calculating occupied units:", error);
        if (!res.headersSent) {
            res.status(500).send("An error occurred");
        }
    }
};

export const getTotalUnits = async (req, res) => {
    const establishmentId = req.establishmentId;

    try {
        const rooms = await Room.findAll({
            where: { establishmentId },
            raw: true,
        });

        const totalUnits = rooms.length;

        return totalUnits;

    } catch (error) {
        console.error("Error fetching total units:", error);
        if (!res.headersSent) {
            res.status(500).send("An error occurred while fetching total units.");
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

        logActivity(adminId, 'create', `Admin ID ${adminId} added a new event with name: ${event_name}.`);

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
        logActivity(req.adminId, 'create_error', `Admin ID ${req.adminId} encountered an error while adding event. Error: ${error.message}`);
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
    const adminId = req.adminId;

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

            logActivity(adminId, 'update', `Admin ID ${adminId} updated event "${rows[0].event_name}" (Event ID: ${eventId}).`);

            return res.json({ 
                success: true, 
                message: 'Event updated successfully', 
                event: rows[0] 
            });
        } else {
            connection.end();
            logActivity(adminId, 'update_error', `Admin ID ${adminId} attempted to update event "${event_name}" (Event ID: ${eventId}), but no changes were made or event not found.`);
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found or no changes made.' 
            });
        }
    } catch (err) {
        console.error('Error updating event:', err);
        logActivity(adminId, 'update_error', `Admin ID ${adminId} encountered an error while updating event "${event_name}" (Event ID: ${eventId}). Error: ${err.message}`);
        return res.status(500).json({ 
            success: false, 
            message: 'An error occurred while updating event data' 
        });
    }
};

export const deleteEvent = async (req, res) => {
    const { eventId } = req.params;
    const adminId = req.adminId;

    try {
        const result = await Calendar.destroy({
            where: { event_id: eventId }
        });

        if (result > 0) {
            logActivity(adminId, 'delete_success', `Admin ID ${adminId} successfully deleted event "${event.event_name}" (Event ID: ${eventId}).`);
            return res.json({ success: true, message: 'Event deleted successfully' });
        } else {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        logActivity(adminId, 'delete_error', `Admin ID ${adminId} encountered an error while deleting event "${eventId}". Error: ${error.message}`);
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

        logActivity(adminId, 'create', `Admin ID ${adminId} successfully added a new notice with title: "${newNotice.title}".`);

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
        logActivity(req.adminId, 'create_error', `Admin ID ${req.adminId} encountered an error while adding a new notice. Error: ${error.message}`);
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
    const adminId = req.adminId;

    try {
        const notice = await Notice.findOne({
            where: { notice_id: noticeId }
        });

        if (!notice) {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }

        const result = await Notice.destroy({
            where: { notice_id: noticeId }
        });

        if (result > 0) {
            logActivity(adminId, 'delete', `Admin ID ${adminId} successfully deleted Notice with title: "${notice.title}" (Notice ID: ${noticeId}).`);

            return res.json({ success: true, message: 'Notice deleted successfully' });
        } else {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }
    } catch (error) {
        console.error('Error deleting notice:', error);

        logActivity(adminId, 'delete_error', `Admin ID ${adminId} encountered an error while deleting Notice ID: ${noticeId}. Error: ${error.message}`);

        return res.status(500).json({ success: false, message: 'Failed to delete notice' });
    }
};
