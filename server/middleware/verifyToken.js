import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect("/admin/login");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.adminId = decoded.adminId;
        req.establishmentId = decoded.establishmentId;
        next();
    } catch (error) {
        console.log("Error in verifyToken", error);
        return res.redirect("/admin/login");
    }
}

export const verifyTenantToken = (req, res, next) => {
    const token = req.cookies.tenantToken; 
    if (!token) {
        return res.redirect("/tenant/login");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        console.log('Decoded token:', decoded);

        if (!decoded) {
            return res.redirect("/tenant/login");
        }

        req.tenantId = decoded.tenantId;
        req.establishmentId = decoded.establishmentId;
        next();
    } catch (error) {
        console.log("Error in verifyTenantToken", error);
        return res.redirect("/tenant/login");
    }
};


// export const verifyTenantToken = (req, res, next) => {
//     const token = req.cookies.tenantToken;  // Get tenant token from cookies
//     if (!token) {
//         return res.status(401).json({
//             success: false,
//             message: "Unauthorized - no token provided"
//         });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token

//         if (!decoded) {
//             return res.status(403).json({
//                 success: false,
//                 message: "Unauthorized - invalid token"
//             });
//         }

//         req.tenantId = decoded.tenant_id; // Store tenantId in the request object
//         next(); // Call the next middleware or route handler
//     } catch (error) {
//         console.log("Error in verifyTenantToken", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal Server Error"
//         });
//     }
// }
