import Admin from '../models/admin.models.js';
import bcryptjs from 'bcryptjs';
import crypto from "crypto";
import { generateTokenAndSetCookie } from '../utils/generateTokenAndSetCookie.js';
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from '../mailtrap/emails.js';

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

        const hashedPassword = await bcryptjs.hash(adminPassword, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const admin = new Admin({
            adminFirstName,
            adminLastName,
            adminEmail,
            adminPassword: hashedPassword,
            eName,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000
        });

        await admin.save();
        
        generateTokenAndSetCookie(res, admin.admin_id);
        
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

        generateTokenAndSetCookie(res, admin.admin_id);

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