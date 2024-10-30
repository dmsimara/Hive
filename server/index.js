// const express = require("express");
// const session = require('express-session');
// const mysql = require("mysql");
// const dotenv = require("dotenv");
// const path = require("path");
// const jwt = require('jsonwebtoken');
// const { authenticateToken } = require('../controllers/auth');

// dotenv.config({ path: './.env'});

// const app = express();

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'hivedb'
// });

// const publicDirectory = path.join(__dirname, './public')
// app.use(express.static(publicDirectory));

// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());

// app.use(session({
//     secret: 'this_is_another_secret_key_shet',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false }  // use http instead of https for development purposes only  // secure: true would make the cookie secure across https only.  // secure: false would make the cookie accessible over http and https.  // secure: false is the default value.  // secure: true would only work if the app is running over https.  // secure: true would only work if the app is running over
// }));

// app.set('view engine', 'hbs');

// db.connect( (error) => {
//     if (error) {
//         console.log(error)
//     } else {
//         console.log("MYSQL Connected...")
//     }
// })

// // define routes
// app.use('/', require('../routes/pages'));
// app.use('/auth', require('../routes/auth'));

// // app.get('/admin/dashboard', (req, res) => {
// //     res.render('adminDashboard');
// // });

// // app.get('/protected', authenticateToken, (req, res) => {
// //     const { adminEmail } = req.user;
// //     res.send('Welcome ${adminEmail}! This is a protected route.');
// // });

// JWT_SECRET = 'this_is_just_another_token';

// app.get('/protected', (req, res) => {
//     const token = req.headers['authorization']?.split(' ')[1];

//     if (!token) {
//         return res.status(403).json({ message: 'No token provided' });
//     }

//     jwt.verify(token, JWT_SECRET, (err, decoded) => {
//         if (err) {
//             return res.render('adminLogin', {
//                 message: 'Failed to authenticate token'
//             });
//         }

//         res.json({ data: 'Protected data'});
//     })
// })


// app.listen(5000, () => {
//     console.log("Server is running on port 5000");
// });

import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url"; // Import fileURLToPath
import { dirname } from "path";
import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.js";
import exphbs from "express-handlebars";
import path from "path";
import { verifyToken } from "./middleware/verifyToken.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // allows us to parse incoming requests: req.body
app.use(cookieParser());

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
        }
    }
}));

app.set("view engine", "hbs");

app.set("views", path.join(__dirname, "../client/views")); 

console.log("Views Directory: ", path.join(__dirname, "../client/views"));

app.use(express.static(path.join(__dirname, "../client/public"))); // Serve static files from the public folder

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.render("home", { title: "Home Page", styles: ["home"] });
});

app.get("/admin/login", (req, res) => {
    res.render("adminLogin", { title: "Hive", styles: ["adminLogin"] });
});

app.get("/admin/register", (req, res) => {
    res.render("adminRegister", { title: "Hive", styles: ["adminRegister"] });
})

app.get("/admin/dashboard", verifyToken, (req, res) => {
    res.render("adminDashboard", { title: "Hive", styles: ["adminDashboard"] });
});

app.get("/admin/register/verifyEmail", (req, res) => {
    res.render("verifyEmail", { title: "Hive", styles: ["verifyEmail"] })
});

app.listen(PORT, () => {
    connectDB();
    console.log("Server is running on port: ", PORT);
})