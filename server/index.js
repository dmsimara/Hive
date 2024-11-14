import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { fileURLToPath } from "url"; 
import { dirname } from "path";
import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.js";
import exphbs from "express-handlebars";
import path from "path";
import session from "express-session"; 
import fileUpload from "express-fileupload";
import fs from 'fs';
import Admin from "./models/admin.models.js";
import Room from "./models/room.models.js";
import Tenant from "./models/tenant.models.js";
import { verifyTenantToken, verifyToken } from "./middleware/verifyToken.js";
import { addTenant, addTenantView, addUnitView, editTenant, findDashTenants, findTenants, findUnits, getAvailableRooms, getOccupiedUnits, updateTenant, viewAdmins, viewTenants, viewUnits } from './controllers/auth.controllers.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // allows us to parse incoming requests: req.body
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Make sure secure is set based on NODE_ENV
}));

app.engine("hbs", exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main", 
    layoutsDir: path.join(__dirname, "../client/views/layouts"), 
    helpers: {
        set: function(variable, value) {
            this[variable] = value;
            return '';
        },
        array: function(...args) {
            return args;
        },
        eq: (a, b) => a === b, 
        // Add the ifCond helper for conditional checks
        ifCond: function(v1, operator, v2, options) {
            switch (operator) {
                case '===':
                    return (v1 === v2) ? options.fn(this) : options.inverse(this);
                case '!==':
                    return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                case '>':
                    return (v1 > v2) ? options.fn(this) : options.inverse(this);
                case '<':
                    return (v1 < v2) ? options.fn(this) : options.inverse(this);
                default:
                    return options.inverse(this);
            }
        }
    }
}));

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "../client/views")); 
console.log("Views Directory: ", path.join(__dirname, "../client/views"));

app.use(express.static(path.join(__dirname, "../client/public"))); // Serve static files from the public folder
// app.use('/images/upload', express.static(path.join(__dirname, 'client/public/images/upload')));

app.use("/api/auth", authRoutes);

// default option for profile pic upload
app.use(fileUpload());

// home route
app.get("/", (req, res) => {
    res.render("home", { title: "Home Page", styles: ["home"] });
});

// admin authentication routes
app.get("/admin/login", (req, res) => {
    res.render("adminLogin", { title: "Hive", styles: ["adminLogin"] });
});

app.get("/admin/register", (req, res) => {
    res.render("adminRegister", { title: "Hive", styles: ["adminRegister"] });
});

app.get("/admin/register/verifyEmail", (req, res) => {
    res.render("verifyEmail", { title: "Hive", styles: ["verifyEmail"] })
});

// tenant authentication routes
app.get("/tenant/login", (req, res) => {
    res.render("tenantLogin", { title: "Hive", styles: ["tenantLogin"] });
});

// ADMIN PAGES ROUTES
app.get("/admin/dashboard", verifyToken, async (req, res) => {
    try {
        const admins = await viewAdmins(req, res);
        console.log('Fetched admin data:', admins);

        const tenants = await viewTenants(req, res);
        console.log('Tenants data:', tenants);

        if (!tenants) {
            return res.render("adminDashboard", {
                title: "Hive",
                styles: ["adminDashboard"],
                admins: admins,
                tenants: tenants || []  
            });
        }

        res.render("adminDashboard", {
            title: "Hive",
            styles: ["adminDashboard"],
            admins: admins,
            tenants: tenants
        });
    } catch (error) {
        console.error('Error fetching admin or tenant data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

app.post("/admin/dashboard", findDashTenants);

// manage room routes
app.get("/admin/manage/unit", verifyToken, async (req, res) => {
    try {
        const admins = await viewAdmins(req, res);
        console.log('Fetched admin data:', admins);

        const units = await viewUnits(req, res);
        console.log('Units:', units);

        if (!units) {
            return res.render("manageUnits", {
                title: "Hive",
                styles: ["manageUnits"],
                admins: admins, 
                units: []
            });
        }

        const occupiedUnits = await getOccupiedUnits(req, res);

        res.render("manageUnits", {
            title: "Hive",
            styles: ["manageUnits"],
            admins: admins,  
            units: units,
            occupiedUnits: occupiedUnits
        });
    } catch (error) {
        console.error('Error fetching admin or unit data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});


const getTenantsByRoomId = async (roomId) => {
    try {
      const tenants = await Tenant.findAll({
        where: {
          room_id: roomId
        }
      });
      return tenants;
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return [];
    }
  };
  
  
  const getRoomDetails = async (roomId) => {
    try {
      const room = await Room.findOne({
        where: {
          room_id: roomId
        }
      });
      return room ? room : {};  
    } catch (error) {
      console.error('Error fetching room details:', error);
      return {};
    }
  };
  
  
  app.get('/admin/manage/unit/tenants/:room_id', async (req, res) => {
    const { room_id } = req.params;
    try {
      const tenants = await getTenantsByRoomId(room_id);
      console.log('Tenants:', tenants); 
      res.json({ tenants });
    } catch (error) {
      console.error('Error fetching tenants:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/admin/manage/unit/tenants', async (req, res) => {
    const roomId = req.query.room_id;
    try {
      const tenants = await getTenantsByRoomId(roomId);
      const roomDetails = await getRoomDetails(roomId);

      if (roomDetails) {
        const rented = roomDetails.roomTotalSlot - roomDetails.roomRemainingSlot;
        
        res.json({
          tenants,
          roomTotalSlot: roomDetails.roomTotalSlot,  
          roomRemainingSlot: roomDetails.roomRemainingSlot,  
          rented: rented
        });
      } else {
        res.status(404).json({ error: "Room not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Error fetching room details" });
    }
});

app.post("/admin/manage/unit", findUnits, async (req, res) => {
    try {
        const admins = await viewAdmins(req, res);

        res.render("manageUnits", {
            title: "Hive",
            styles: ["manageUnits"],
            rows: admins,
            units: req.units
        });
    } catch (error) {
        console.error('Error fetching tenant or admin data:', error);
        res.status(500).json({ success: false, message: 'Error fetching unit or admin data' });
    }
});

// userManagement routes
app.post("/admin/dashboard/userManagement", findTenants, async (req, res) => {
    try {
        const admins = await viewAdmins(req, res); 

        res.render("userManagement", { 
            title: "Hive", 
            styles: ["userManagement"], 
            tenants: req.tenants,
            admin: admins 
        });
    } catch (error) {
        console.error('Error fetching tenant or admin data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

app.get("/admin/manage/unit/add", verifyToken, addUnitView);


// user management routes
app.get("/admin/dashboard/userManagement", verifyToken, async (req, res) => {
    try {
        const tenants = await viewTenants(req, res);  
        const admins = await viewAdmins(req, res);  

        console.log('Fetched tenant data:', tenants);
        console.log('Fetched admin data:', admins);

        const tenantId = req.query.tenantId;  
        let tenantToEdit = null;
        
        if (tenantId) {
            tenantToEdit = tenants.find(tenant => tenant.tenant_id === tenantId);
            if (!tenantToEdit) {
                return res.status(404).json({ success: false, message: 'Tenant not found' });
            }
        }

        res.render("userManagement", {
            title: "Hive",
            styles: ["userManagement"],
            rows: tenants || [], 
            admin: admins,
            tenantToEdit  
        });

    } catch (error) {
        console.error('Error fetching tenant or admin data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

app.post("/admin/dashboard/userManagement", findTenants, (req, res) => {
     res.render("userManagement", { title: "Hive", styles: ["userManagement"], tenants: req.tenants });
 });

app.get("/admin/dashboard/userManagement/add", verifyToken, addTenantView);

app.get("/admin/dashboard/userManagement/editTenant/:tenant_id", verifyToken, async (req, res) => {
    try {
        const tenant = await Tenant.findOne({ where: { tenant_id: req.params.tenant_id } });
        const admins = await viewAdmins(req, res);

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        const plainTenant = tenant.get({ plain: true });

        res.render("editTenant", {
            title: "Hive",
            styles: ["editTenant"],
            rows: [plainTenant], 
            admin: admins
        });
    } catch (error) {
        console.error('Error fetching tenant or admin data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

app.put('/api/auth/updateTenant/:tenantId', updateTenant);
app.get('/api/auth/getAvailableRooms', getAvailableRooms);


// view and edit account
app.get("/admin/dashboard/view/account", verifyToken, async (req, res) => {
    try {
        const admins = await viewAdmins(req, res);

        res.render("viewAdminAccount", {
            title: "Hive",
            styles: ["viewAdminAccount"],
            rows: admins
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.status(500).json({ success: false, message: 'Error fetching admin data' });
    }
});
app.get("/admin/dashboard/edit/account", verifyToken, async (req, res) => {
    try {
        const admins = await viewAdmins(req, res);

        res.render("editAdminAccount", {
            title: "Hive",
            styles: ["editAdminAccount"],
            rows: admins
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.status(500).json({ success: false, message: 'Error fetching admin data' });
    }
});

app.post("/admin/dashboard/edit/account", verifyToken, async (req, res) => {
    try {
        let adminProfile = req.body.adminProfile;  
        
        if (req.files && Object.keys(req.files).length > 0) {
            const sampleFile = req.files.sampleFile;
            const uploadDir = path.join(__dirname, '..', 'client', 'public', 'images', 'upload');
            const uploadPath = path.join(uploadDir, sampleFile.name);

            fs.mkdir(uploadDir, { recursive: true }, async (err) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Failed to create upload directory.' });
                }

                sampleFile.mv(uploadPath, async (err) => {
                    if (err) return res.status(500).json({ success: false, message: err });

                    adminProfile = sampleFile.name;

                    await updateAdminDetails(req.body, adminProfile);
                    return res.json({ success: true, message: 'Admin details updated successfully.' });
                });
            });
        } else {
            await updateAdminDetails(req.body, adminProfile);
            return res.json({ success: true, message: 'Admin details updated successfully.' });
        }
    } catch (error) {
        console.error('Error updating admin account:', error);
        return res.status(500).json({ success: false, message: 'Failed to update admin account.' });
    }
});

const updateAdminDetails = async (body, adminProfile) => {
    const adminDetails = {
        adminProfile: adminProfile,  
        adminEmail: body.adminEmail,
        adminFirstName: body.adminFirstName,
        adminLastName: body.adminLastName,
        eName: body.eName,
    };
    const adminId = body.admin_id; 
    await Admin.update(adminDetails, { where: { admin_id: adminId } });
};


app.get('/api/auth/admin/totalUnits', async (req, res) => {
    try {
        const { establishmentId } = req.admin; 
        
        const totalUnits = await Room.sum('roomTotalSlot', {
            where: { establishmentId }
        });

        res.status(200).json({ totalUnits });
    } catch (error) {
        console.error('Error calculating total units:', error);
        res.status(500).json({ message: 'Failed to calculate total units' });
    }
});


 // TENANT PAGES ROUTES
 app.get("/tenant/dashboard", verifyTenantToken, (req, res) => {
    res.render("tenantDashboard", { title: "Hive", styles: ["ten-dashboard"] });
});

app.get("/tenant/room-details", verifyTenantToken, (req, res) => {
    res.render("ten-RoomDeets", { title: "Hive", styles: ["ten-deets"] });
});

app.get("/tenant/announcement", verifyTenantToken, (req, res) => {
    res.render("ten-announcement", { title: "Hive", styles: ["ten-announce"] });
});

 app.post("/api/auth/addTenant", verifyToken, addTenant);

app.listen(PORT, () => {
    connectDB();
    console.log("Server is running on port: ", PORT);
})