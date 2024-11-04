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
import { verifyTenantToken, verifyToken } from "./middleware/verifyToken.js";
import { addTenant, addTenantView, addUnitView, editTenant, findTenants, findUnits, getOccupiedUnits, viewAdmins, viewTenants, viewUnits } from './controllers/auth.controllers.js';


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

        res.render("adminDashboard", {
            title: "Hive",
            styles: ["adminDashboard"],
            rows: admins 
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.status(500).json({ success: false, message: 'Error fetching admin data' });
    }
});

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
                rows: admins,
                units: []
            });
        }

        // Call getOccupiedUnits
        const occupiedUnits = await getOccupiedUnits(req, res);

        res.render("manageUnits", {
            title: "Hive",
            styles: ["manageUnits"],
            rows: admins,
            units: units,
            occupiedUnits 
        });
    } catch (error) {
        console.error('Error fetching admin or unit data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});


app.post("/admin/manage/unit", findUnits, (req, res) => {
    res.render("manageUnits", { title: "Hive", styles: ["manageUnits"], rooms: req.rooms });
})

app.get("/admin/manage/unit/add", verifyToken, addUnitView);


// user management routes
 app.get("/admin/dashboard/userManagement", verifyToken, viewTenants);
 app.post("/admin/dashboard/userManagement", findTenants, (req, res) => {
     res.render("userManagement", { title: "Hive", styles: ["userManagement"], tenants: req.tenants });
 });

 app.get("/admin/dashboard/userManagement/add", verifyToken, addTenantView);

 app.get("/admin/dashboard/userManagement/editTenant/:tenant_id", verifyToken, editTenant);

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
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ success: false, message: 'No files were uploaded' });
    }

    const sampleFile = req.files.sampleFile;
    const uploadDir = path.join(__dirname, '..', 'client', 'public', 'images', 'upload');
    const uploadPath = path.join(uploadDir, sampleFile.name);

    fs.mkdir(uploadDir, { recursive: true }, async (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Failed to create upload directory.' });

        sampleFile.mv(uploadPath, async (err) => {
            if (err) return res.status(500).json({ success: false, message: err });

            try {
                const adminDetails = {
                    adminProfile: sampleFile.name, 
                    adminEmail: req.body.adminEmail,
                    adminFirstName: req.body.adminFirstName,
                    adminLastName: req.body.adminLastName,
                    eName: req.body.eName,
                };

                const adminId = req.body.admin_id; 
                await Admin.update(adminDetails, { where: { admin_id: adminId } });

                return res.json({ success: true, message: 'File uploaded and admin details updated successfully.', filePath: uploadPath });
            } catch (dbError) {
                console.error('Error saving admin details to database:', dbError);
                return res.status(500).json({ success: false, message: 'Failed to save admin details to database.' });
            }
        });
    });
});

// Example: Define a route to get the total units for the admin's establishment
app.get('/api/auth/admin/totalUnits', async (req, res) => {
    try {
        const { establishmentId } = req.admin; // Assuming `establishmentId` is part of `req.admin`
        
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
    res.render("tenantDashboard", { title: "Hive", styles: ["tenantDashboard"] });
});

 app.post("/api/auth/addTenant", verifyToken, addTenant);

app.listen(PORT, () => {
    connectDB();
    console.log("Server is running on port: ", PORT);
})