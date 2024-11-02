import Admin from '../models/admin.models.js';
import Tenant from '../models/tenant.models.js';
import Room from '../models/room.models.js';
import bcryptjs from 'bcryptjs';
import crypto from "crypto";
import path from 'path';
import { generateTokenAndSetCookie, generateTokenAndSetTenantCookie } from '../utils/generateTokenAndSetCookie.js';
import { sendPasswordResetEmail, sendResetSuccessEmail, sendTenantVerificationEmail, sendVerificationEmail, sendWelcomeEmail } from '../mailtrap/emails.js';
import { connectDB } from '../db/connectDB.js';
import { Op } from 'sequelize';


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

        request.session.adminFirstName = admin.adminFirstName;
    } catch (error) {
        console.log("Error in login:", error);
        res.status(400).json({ success: false, message: error.message});
    }
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
    try {
        // const rows = await Tenant.findAll();
        const rows = await Tenant.findAll({
            where: {
                status: 'active' 
            }
        });

        const plainRows = rows.map(row => {
            const tenant = row.get({ plain: true });
            tenant.gender = tenant.gender === 'M' ? 'Male' : tenant.gender === 'F' ? 'Female' : 'Other';
            return tenant;
        });


        if (!plainRows.length) {
            return res.status(404).json({ success: false, message: 'No tenants found' });
        }

        res.render('userManagement', {
            title: "Hive",
            styles: ["userManagement"],
            rows: plainRows, 
        });
    } catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({ success: false, message: 'Error fetching tenants' });
    }
};

export const viewAdmins = async (req, res) => {
    try {
        const rows = await Admin.findAll();

        const plainRows = rows.map(row => {
            const admin = row.get({ plain: true });
            return {
                admin_id: admin.admin_id,
                adminFirstName: admin.adminFirstName,
                adminLastName: admin.adminLastName,
                adminEmail: admin.adminEmail,
                eName: admin.eName,
                adminProfile: admin.adminProfile
            };
        });

        return plainRows; // Return the admin 
        // return res.status(200).json({ success: true, admins: plainRows });
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ success: false, message: 'Error fetching admins' });
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

export const addTenant = async (req, res) => {
      const { tenantFirstName, tenantLastName, tenantEmail, gender, mobileNum, tenantPassword, tenantConfirmPassword  } = req.body;

      try {
          if (!tenantFirstName || !tenantLastName || !tenantEmail || !gender || !mobileNum || !tenantPassword || !tenantConfirmPassword ) {
              return res.status(400).json({ success: false, message: "All fields are required." });
          }

           if (tenantPassword !== tenantConfirmPassword) {
                return res.status(400).json({ success: false, message: "Passwords do not match." });
           }

          const existingTenant = await Tenant.findOne({ where: { tenantEmail } });
          if (existingTenant) {
              return res.status(400).json({ success: false, message: "Tenant already exists." });
          }

          // Hash password
          const hashedPassword = await bcryptjs.hash(tenantPassword, 10);

          // Insert tenant into the database using ORM
          const newTenant = await Tenant.create({
              tenantFirstName,
              tenantLastName,
              tenantEmail,
              gender,
              mobileNum,
              tenantPassword: hashedPassword
          });
        
          generateTokenAndSetTenantCookie(res, newTenant.tenant_id);
        
          return res.status(201).json({ success: true, message: "Tenant added successfully", tenant: newTenant});
      } catch (error) {
          console.error('Error adding tenant:', error);
          res.status(500).json({ success: false, message: error.message });
      }
  };

export const addTenantView = async (req, res) => {
    res.render('addTenants');
};

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

