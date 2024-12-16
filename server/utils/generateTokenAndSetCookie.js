import jwt from "jsonwebtoken";

// Defines two functions that generate JWT tokens and set them as HTTP-only cookies in the response.
// The first function is for generating and setting an admin token, while the second is for a tenant token.

export const generateTokenAndSetCookie = (res, adminId, establishmentId) => {
    const token = jwt.sign({ adminId, establishmentId }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

    res.cookie("token", token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return token;
};

export const generateTokenAndSetTenantCookie = (res, tenantId, establishmentId) => {
    const token = jwt.sign({ tenantId, establishmentId }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

    res.cookie("tenantToken", token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return token;
};
