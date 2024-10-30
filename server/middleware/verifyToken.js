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