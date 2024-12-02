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
import cors from 'cors';
import Admin from "./models/admin.models.js";
import Room from "./models/room.models.js";
import Tenant from "./models/tenant.models.js";
import Notice from "./models/notice.models.js";
import { verifyTenantToken, verifyToken } from "./middleware/verifyToken.js";
import { addTenant, addTenantView, addUnitView, editTenant, findDashTenants, findTenants, findUnits, getAvailableRooms, getEvents, getNotices, getOccupiedUnits, updateEvent, updateTenant, viewAdmins, viewEvents, viewNotices, viewTenants, viewUnits } from './controllers/auth.controllers.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5000",
    credentials: true
}));


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } 
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
        },
        json: function(context) {
            return JSON.stringify(context);
        },
        isArrayEmpty: function(arr) {
            return arr && arr.length === 0;
          }
    }
}));

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "../client/views")); 
console.log("Views Directory: ", path.join(__dirname, "../client/views"));

app.use(express.static(path.join(__dirname, "../client/public"))); 

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
      const admin = await viewAdmins(req, res);
      const establishmentId = req.establishmentId;
      const tenantsData = await viewTenants(req);
      const events = await getEvents(req, res);
      const notices = await getNotices(req, res); 
  
      console.log("Admin:", admin);
      console.log("Tenants:", tenantsData);
      console.log("Events:", events);
      console.log("Notices:", notices);
  
      if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.json({
          success: true,
          tenants: tenantsData.tenants || [],
          establishmentId: establishmentId,
        });
      }
  
      res.render("adminDashboard", {
        title: "Hive",
        styles: ["adminDashboard"],
        admin: admin || {},
        tenants: tenantsData.tenants || [],
        events: events || [],
        notices: notices || [], 
        establishmentId: establishmentId,
      });
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
      res.status(500).json({ success: false, message: "Error fetching admin dashboard data" });
    }
  });
  
app.post("/admin/dashboard", verifyToken, findDashTenants);


app.get("/admin/manage/unit", verifyToken, async (req, res) => {
    try {
      const admin = await viewAdmins(req);
      console.log("Fetched admin data for unit management:", admin);
  
      const unitsData = await viewUnits(req, res);
      console.log("Units Data:", unitsData);
  
      const occupiedUnits = unitsData.success ? await getOccupiedUnits(req, res) : [];
  
      res.render("manageUnits", {
        title: "Hive",
        styles: ["manageUnits"],
        admin: admin,
        units: unitsData.units || [],
        occupiedUnits: occupiedUnits
      });
    } catch (error) {
      console.error("Error fetching admin or unit data:", error);
      res.status(500).json({ success: false, message: "Error fetching data" });
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
        
        if (room) {
            const roomTotalSlot = parseInt(room.roomTotalSlot, 10) || 0; 
            const roomRemainingSlot = parseInt(room.roomRemainingSlot, 10) || 0; 
            return { roomTotalSlot, roomRemainingSlot };
        }
        return {};  
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

        if (roomDetails && roomDetails.roomTotalSlot != null && roomDetails.roomRemainingSlot != null) {
            const rented = roomDetails.roomTotalSlot - roomDetails.roomRemainingSlot;

            res.json({
                tenants,
                roomTotalSlot: roomDetails.roomTotalSlot,  
                roomRemainingSlot: roomDetails.roomRemainingSlot,  
                rented: rented
            });
        } else {
            res.status(404).json({ error: "Room not found or invalid data" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error fetching room details" });
    }
});

app.post("/admin/manage/unit", findUnits, async (req, res) => {
    try {
        const admin = await viewAdmins(req);

        res.render("manageUnits", {
            title: "Hive",
            styles: ["manageUnits"],
            rows: admin,
            units: req.units
        });
    } catch (error) {
        console.error('Error fetching tenant or admin data:', error);
        res.status(500).json({ success: false, message: 'Error fetching unit or admin data' });
    }
});
  
// userManagement routes
app.post("/admin/dashboard/userManagement", verifyToken, findTenants, async (req, res) => {
    try {
        const admin = await viewAdmins(req, res);

        // Render the user management page
        res.render("userManagement", {
            title: "Hive",
            styles: ["userManagement"],
            tenants: req.tenants,
            admin: admin
        });
    } catch (error) {
        console.error('Error fetching tenant or admin data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

app.post('/api/auth/find-tenants', async (req, res) => {
    try {
        const search = req.body.search || '';
        const [results] = await db.query("SELECT * FROM tenants WHERE tenantFirstName LIKE ? OR tenantLastName LIKE ?", [`%${search}%`, `%${search}%`]);
        res.json({ success: true, tenants: results });
    } catch (error) {
        console.error("Error fetching tenants:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


app.get("/admin/manage/unit/add", verifyToken, addUnitView);


// user management routes
app.get("/admin/dashboard/userManagement", verifyToken, async (req, res) => {
    try {
        const { tenants, success } = await viewTenants(req);  
        const admins = await viewAdmins(req, res);  

        console.log('Fetched tenant data:', tenants);
        console.log('Fetched admin data:', admins);

        if (!success) {
            return res.status(500).json({ success: false, message: 'Error fetching tenant data' });
        }

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
app.get('/api/auth/getAvailableRooms', verifyToken, getAvailableRooms);

// view and edit account
app.get("/admin/dashboard/view/account", verifyToken, async (req, res) => {
    try {
        const admin = await viewAdmins(req);  

        res.render("viewAdminAccount", {
            title: "Hive",
            styles: ["viewAdminAccount"],
            admin: admin 
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.status(500).json({ success: false, message: 'Error fetching admin data' });
    }
});

app.get("/admin/dashboard/edit/account", verifyToken, async (req, res) => {
    try {
        const admin = await viewAdmins(req);  

        res.render("editAdminAccount", {
            title: "Hive",
            styles: ["editAdminAccount"],
            admin: admin  
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

// Tracker Page Route
app.get("/admin/tracker", verifyToken, async (req, res) => {
    try {
        const events = await viewEvents(req);  
        const admin = await viewAdmins(req); 
        const tenants = await viewTenants(req);

        const eventsData = events.success ? events.events : [];

        res.render("adminTracker", {
            title: "Hive",
            styles: ["adminTracker"],
            events: eventsData,  
            admin: admin || [],  
            tenants: tenants || []  
        });
    } catch (error) {
        console.error('Error fetching data for admin tracker:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

app.put('/api/auth/updateEvent/:eventId', async (req, res) => {
    const eventId = req.params.eventId;
    const { event_name, event_description, start, end, status } = req.body;
  
    try {
      const updatedEvent = await Event.update(
        {
          event_name,
          event_description,
          start,
          end,
          status,
        },
        {
          where: {
            id: eventId,
          },
        }
      );
  
      if (updatedEvent[0] === 0) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }
  
      return res.status(200).json({ success: true, message: 'Event updated successfully' });
    } catch (error) {
      console.error('Error updating event:', error);
      return res.status(500).json({ success: false, message: 'Error updating event' });
    }
  });

// ANNOUNCEMENT PAGE ROUTES
app.get("/admin/announcements", verifyToken, async (req, res) => {
    try {
        const { filter } = req.query; 
        const admin = await viewAdmins(req);

        let notices = [];

        switch (filter) {
            case "pinned":
                notices = await Notice.findAll({
                    where: {
                        establishment_id: req.establishmentId,
                        pinned: true,
                    },
                    order: [['updated_at', 'DESC']],
                });
                break;

            case "permanent":
                notices = await Notice.findAll({
                    where: {
                        establishment_id: req.establishmentId,
                        permanent: true,
                    },
                    order: [['updated_at', 'DESC']],
                });
                break;

            default:
                const response = await viewNotices(req, res);
                notices = response.notices || []; 
                break;
        }

        if (notices.length === 0) {
            const message = filter === 'pinned'
                ? "There are no pinned notices at the moment. Please check back later."
                : "There are no permanent notices at the moment. Please check back later.";

            notices = [{
                title: filter === 'pinned' ? "No pinned notices yet" : "No permanent notices yet",
                content: message,
                pinned: false,
                permanent: false,
                updated_at: new Date().toLocaleString(), 
            }];
        }

        const plainNotices = notices.map(notice => notice.get ? notice.get({ plain: true }) : notice);

        if (req.headers['accept'] === 'application/json') {
            return res.json({ success: true, notices: plainNotices });
        }

        res.render("announcements", {
            title: "Hive",
            styles: ["announcements"],
            admin: admin || [],  
            notices: plainNotices || [], 
        });

    } catch (error) {
        console.error('Error fetching data for admin tracker:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Error fetching data' });
        }
    }
});
  
  
 // TENANT PAGES ROUTES
 const getTenantsDashboard = async (roomId) => {
    try {
        const tenants = await Tenant.findAll({
            where: { room_id: roomId }
        });
        return tenants; 
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return []; 
    }
};

 app.get("/tenant/dashboard", verifyTenantToken, async (req, res) => {
    const tenantId = req.tenantId; 
    if (!tenantId) {
        return res.status(400).send("Tenant ID not found in the token.");
    }

    try {
        const tenant = await Tenant.findOne({
            where: { tenant_id: tenantId }
        });

        if (!tenant) {
            return res.status(404).send("Tenant not found");
        }

        const roomId = tenant.get('room_id'); 

        const room = await Room.findOne({
            where: { room_id: roomId }
        });

        console.log('Room data:', room);

        if (!room) {
            return res.status(404).send("Room not found");
        }

        const roomNumber = room.get('roomNumber');
        const roomTotalSlot = room.get('roomTotalSlot'); 
        const roomRemainingSlot = room.get('roomRemainingSlot'); 

        console.log('roomTotalSlot:', roomTotalSlot);
        console.log('roomRemainingSlot:', roomRemainingSlot);

        const roomTotalSlotInt = parseInt(roomTotalSlot, 10) || 0;
        const roomRemainingSlotInt = parseInt(roomRemainingSlot, 10) || 0;

        console.log('roomTotalSlotInt:', roomTotalSlotInt);
        console.log('roomRemainingSlotInt:', roomRemainingSlotInt);

        if (isNaN(roomTotalSlotInt) || isNaN(roomRemainingSlotInt)) {
            return res.status(400).send("Invalid room slot values.");
        }

        const rentedSlot = roomTotalSlotInt - roomRemainingSlotInt;

        const tenants = await getTenantsDashboard(roomId);

        const plainTenants = tenants.map(tenant => tenant.get({ plain: true }));

        res.render("tenantDashboard", {
            title: "Hive",
            styles: ["ten-dashboard"],
            tenants: plainTenants,
            roomNumber: roomNumber,
            rentedSlot: rentedSlot 
        });
    } catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).send("Error fetching tenant data.");
    }
});

app.get("/tenant/announcement", verifyTenantToken, async (req, res) => {
    try {
        const { filter } = req.query;

        const tenant = await Tenant.findOne({ where: { tenant_id: req.tenantId } });
        if (!tenant) {
            return res.status(404).json({ message: "Tenant not found" });
        }

        const roomId = tenant.room_id;
        const room = await Room.findOne({ where: { room_id: roomId } });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        req.establishmentId = room.establishment_id;

        const whereClause = { establishment_id: req.establishmentId };
        if (filter === "pinned") whereClause.pinned = true;
        if (filter === "permanent") whereClause.permanent = true;

        let notices = await Notice.findAll({
            where: whereClause,
            order: [["updated_at", "DESC"]],
        });

        if (notices.length === 0) {
            notices = [{
                title: filter === "pinned" ? "No pinned notices yet" : "No permanent notices yet",
                content: "No notices available at the moment.",
                pinned: false,
                permanent: false,
                updated_at: new Date().toLocaleString(),
            }];
        }

        if (req.xhr) {
            return res.json({
                notices: notices.map(notice => notice.dataValues) 
            });
        }

        res.render("ten-announcement", {
            title: "Hive",
            styles: ["ten-announce"],
            notices: notices.map(notice => notice.dataValues),  
        });
    } catch (error) {
        console.error("Error fetching notices:", error);
        
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/tenant/utilities", verifyTenantToken, async (req, res) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
        return res.status(400).send("Tenant ID not found in the token.");
    }

    try {
        const tenant = await Tenant.findOne({
            where: { tenant_id: tenantId }
        });

        if (!tenant) {
            return res.status(404).send("Tenant not found");
        }

        const roomId = tenant.get('room_id');

        const room = await Room.findOne({
            where: { room_id: roomId }
        });

        if (!room) {
            return res.status(404).send("Room not found");
        }

        const roomNumber = room.get('roomNumber');

        const tenants = await getTenantsDashboard(roomId);

        const plainTenants = tenants.map(tenant => tenant.get({ plain: true }));

        res.render("ten-utilities", {
            title: "Hive",
            styles: ["ten-utilities"],
            tenants: plainTenants,
            roomNumber: roomNumber
        });
    } catch (error) {
        console.error('Error fetching tenant utilities:', error);
        res.status(500).send("Error fetching tenant utilities.");
    }
});

app.post("/api/auth/addTenant", verifyToken, addTenant); 

app.get("/tenant/room-details", verifyTenantToken, async (req, res) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
        return res.status(400).send("Tenant ID not found in the token.");
    }

    try {
        const tenant = await Tenant.findOne({
            where: { tenant_id: tenantId }
        });

        if (!tenant) {
            return res.status(404).send("Tenant not found");
        }

        const roomId = tenant.get('room_id');

        const tenants = await getTenantsDashboard(roomId);

        const room = await Room.findOne({
            where: { room_id: roomId }
        });

        if (!room) {
            return res.status(404).send("Room not found");
        }

        const roomNumber = room.get('roomNumber');
        const roomType = room.get('roomType');
        const floorNumber = room.get('floorNumber');
        const roomTotalSlot = room.get('roomTotalSlot');
        const plainTenants = tenants.map(tenant => tenant.get({ plain: true }));

        res.render("ten-RoomDeets", {
            title: "Hive",
            styles: ["ten-deets"],
            tenants: plainTenants,
            roomNumber: roomNumber,
            roomType: roomType,
            floorNumber: floorNumber,
            roomTotalSlot: roomTotalSlot
        });
    } catch (error) {
        console.error('Error fetching tenant data:', error);
        res.status(500).send("Error fetching tenant data.");
    }
});

// view and edit account
app.get("/tenant/room-details/view/account", verifyTenantToken, async (req, res) => {
    const tenantId = req.tenantId;

    if (!tenantId) {
        return res.status(400).send("Tenant ID not found in the token.");
    }

    try {
        const tenant = await Tenant.findOne({
            where: { tenant_id: tenantId },
        });

        if (!tenant) {
            return res.status(404).send("Tenant not found");
        }

        const roomId = tenant.get("room_id");

        const tenants = await getTenantsDashboard(roomId);

        const plainTenants = tenants.map((tenant) => tenant.get({ plain: true }));

        res.render("viewTenantAccount", {
            title: "Hive",
            styles: ["viewTenantAccount"],
            tenant: plainTenants, 
        });
    } catch (error) {
        console.error("Error fetching tenant data:", error);
        res.status(500).json({ success: false, message: "Error fetching tenant data" });
    }
});

app.get("/tenant/room-details/edit/account", verifyTenantToken, async (req, res) => {
    try {
        const tenant = await Tenant.findOne({ where: { tenant_id: req.tenantId } });
        if (!tenant) {
            return res.status(404).send("Tenant not found");
        }

        res.render("editTenantAccount", {
            title: "Hive",
            styles: ["editTenantAccount"],
            tenant: tenant.get({ plain: true }),
        });
    } catch (error) {
        console.error("Error fetching tenant data:", error);
        res.status(500).json({ success: false, message: "Error fetching tenant data" });
    }
});

app.post("/tenant/room-details/edit/account", verifyTenantToken, async (req, res) => {
    try {
        let tenantProfile = req.body.tenantProfile;

        if (req.files && req.files.sampleFile) {
            const sampleFile = req.files.sampleFile;
            const uploadDir = path.join(__dirname, "..", "client", "public", "images", "upload");
            const uploadPath = path.join(uploadDir, sampleFile.name);

            fs.mkdirSync(uploadDir, { recursive: true });

            sampleFile.mv(uploadPath, async (err) => {
                if (err) {
                    console.error("Error moving file:", err);
                    return res.status(500).json({ success: false, message: "File upload failed." });
                }

                tenantProfile = sampleFile.name; 
                await updateTenantDetails(req.body, tenantProfile);
                return res.json({ success: true, message: "Tenant details updated successfully." });
            });
        } else {
            await updateTenantDetails(req.body, tenantProfile);
            return res.json({ success: true, message: "Tenant details updated successfully." });
        }
    } catch (error) {
        console.error("Error updating tenant account:", error);
        res.status(500).json({ success: false, message: "Failed to update tenant account." });
    }
});

const updateTenantDetails = async (body, tenantProfile) => {
    const tenantDetails = {
        tenantProfile: tenantProfile,
        tenantEmail: body.tenantEmail,
        tenantFirstName: body.tenantFirstName,
        tenantLastName: body.tenantLastName,
        gender: body.gender,
        mobileNum: body.mobileNum,
        tenantGuardianName: body.tenantGuardianName,
        tenantGuardianNum: body.tenantGuardianNum,
    };

    const tenantId = body.tenant_id;
    await Tenant.update(tenantDetails, { where: { tenant_id: tenantId } });
};




app.listen(PORT, () => {
    connectDB();
    console.log("Server is running on port: ", PORT);
})

