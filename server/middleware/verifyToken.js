import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        res.status(401).json({
            success: false,
            message: "Unauthorized - no token provided"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            res.status(403).json({
                success: false,
                message: "Unauthorized - invalid token"
            });
        }

        req.adminId = decoded.adminId;
        next();
    } catch (error) {
        console.log("Error in verifyToken", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const verifyTenantToken = (req, res, next) => {
    const token = req.cookies.tenantToken; // Get tenant token from cookies
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - no token provided"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token

        if (!decoded) {
            res.status(403).json({
                success: false,
                message: "Unauthorized - invalid token"
            });
        }

        req.tenantId = decoded.tenantId;
        next();
    } catch (error) {
        console.log("Error in verifyTenantToken", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
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
