import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.USER,
        pass: process.env.APP_PASSWORD,
    },
});

export const sendMail = async (to, subject, text = null, html = null) => {
    const mailOptions = {
        from: {
            name: 'Hive',
            address: process.env.USER,
        },
        to,
        subject,
        ...(text && { text }),  
        ...(html && { html }), 
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error; 
    }
};
