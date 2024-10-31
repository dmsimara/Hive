import { PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js";
import { mailtrapClient, sender } from './mailtrap.js';

export const sendVerificationEmail = async (adminEmail, verificationToken) => {
    const recipient = [{ email: adminEmail }];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: 'Admin Verification',
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email Verification"
        })

        console.log("Email sent successfully", response)
    } catch (error) {
        console.error('Error sending verification email:', error.response ? error.response.data : error.message);

        throw new Error('Error sending verification email: ${error.message}');
    }
};

export const sendTenantVerificationEmail = async (tenantEmail, verificationToken) => {
    const recipient = [{ email: tenantEmail }];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: 'Tenant Verification',
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email Verification"
        });

        console.log("Email sent successfully", response);
    } catch (error) {
        console.error('Error sending verification email:', error.response ? error.response.data : error.message);

        throw new Error(`Error sending verification email: ${error.message}`);
    }
};


export const sendWelcomeEmail = async (adminEmail, adminFirstName) => {
    const recipient = [{ email: adminEmail }];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            template_uuid: "87b20c76-322b-4591-b7fe-00b891c6089b",
            template_variables: {
                company_info_name: "Hive",
                name: adminFirstName,
            },
        });

        console.log("Welcome email sent successfully", response);
        
    } catch (error) {
        console.error('Error sending welcome email:', error.response ? error.response.data : error.message);

        throw new Error('Error sending welcome email: ${error.message}');
    }
};

export const sendPasswordResetEmail = async (adminEmail, resetURL) => {
    const recipient = [{ email: adminEmail }];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Reset your password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
            category: "Password Reset",
        })
    } catch (error) {
        console.error('Error sending password reset email:', error.response ? error.response.data : error.message);

        throw new Error(`Error sending password reset email: ${error.message}`);
    }
}

export const sendResetSuccessEmail = async (adminEmail) => {
    const recipient = [{ email: adminEmail }];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Password Reset Successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
            category: "Password Reset",
        });

        console.log("Password reset email sent successfully", response);
    } catch (error) {
        console.error(`Error sending password reset success email`, error);

        throw new Error(`Error sending password reset success email: ${error.message}`);
    }
}