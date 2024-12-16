import jwt from "jsonwebtoken";

// Verifies the JWT token sent by an admin in the request cookies.
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

// Verifies the JWT token sent by a tenant in the request cookies.
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