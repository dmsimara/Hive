import jwt from "jsonwebtoken";

// export const generateTokenAndSetCookie = (res, adminId) => {
//     const token = jwt.sign({ adminId }, process.env.JWT_SECRET, {
//         expiresIn: '7d',
//     })

//     res.cookie("token", token, {
//         httpOnly: true, 
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     return token;
// }

// export const generateTokenAndSetTenantCookie = (res, tenantId) => {
//     const token = jwt.sign({ tenantId }, process.env.JWT_SECRET, {
//         expiresIn: '7d',
//     })

//     res.cookie("tenantToken", token, {
//         httpOnly: true, 
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     return token;
// };

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
