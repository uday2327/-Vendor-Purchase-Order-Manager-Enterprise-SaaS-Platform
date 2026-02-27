const nodemailer = require('nodemailer');

// Create transporter — uses env vars or falls back to Ethereal for dev/testing
let transporter;

const initTransporter = async () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    } else {
        // Ethereal test account for development
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });
        console.log('[Email] Using Ethereal test account:', testAccount.user);
    }
};

initTransporter().catch(console.error);

const sendEmail = async ({ to, subject, html }) => {
    try {
        if (!transporter) await initTransporter();
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Vendor & PO Manager" <noreply@vendorpo.com>',
            to, subject, html,
        });
        console.log(`[Email] Sent to ${to}: ${info.messageId}`);
        if (info.messageId && !process.env.SMTP_HOST) {
            console.log('[Email] Preview:', nodemailer.getTestMessageUrl(info));
        }
        return info;
    } catch (error) {
        console.error('[Email] Send failed:', error.message);
    }
};

// ── Template Helpers ──

const emailWrapper = (title, body) => `
    <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:24px 32px">
            <h1 style="color:#fff;margin:0;font-size:20px">${title}</h1>
        </div>
        <div style="padding:24px 32px;color:#334155;line-height:1.6">${body}</div>
        <div style="padding:16px 32px;background:#f1f5f9;text-align:center;font-size:12px;color:#94a3b8">
            Vendor & PO Manager — Enterprise SaaS Platform
        </div>
    </div>`;

const sendPOApprovalEmail = async (to, poNumber, status, approverName, comments) => {
    const isApproved = status === 'Approved';
    const color = isApproved ? '#10b981' : '#ef4444';
    const icon = isApproved ? '✅' : '❌';
    return sendEmail({
        to,
        subject: `PO ${poNumber} ${status}`,
        html: emailWrapper(`${icon} Purchase Order ${status}`, `
            <p>Purchase Order <strong>${poNumber}</strong> has been <span style="color:${color};font-weight:bold">${status}</span>.</p>
            <p><strong>Reviewed by:</strong> ${approverName}</p>
            ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
            <p style="margin-top:16px"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/purchase-orders" style="background:#6366f1;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600">View PO</a></p>
        `),
    });
};

const sendOverdueInvoiceEmail = async (to, invoiceNumber, vendorName, amount, daysOverdue) => {
    return sendEmail({
        to,
        subject: `⚠️ Overdue Invoice: ${invoiceNumber}`,
        html: emailWrapper('⚠️ Overdue Invoice Alert', `
            <p>Invoice <strong>${invoiceNumber}</strong> is <span style="color:#ef4444;font-weight:bold">${daysOverdue} days overdue</span>.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Vendor</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600">${vendorName}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Outstanding</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#ef4444">₹${amount.toLocaleString()}</td></tr>
            </table>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/invoices" style="background:#6366f1;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Invoice</a></p>
        `),
    });
};

const sendBudgetAlertEmail = async (to, department, utilization, spent, limit) => {
    const color = utilization >= 90 ? '#ef4444' : '#f59e0b';
    return sendEmail({
        to,
        subject: `🚨 Budget Alert: ${department} at ${utilization}%`,
        html: emailWrapper('🚨 Budget Alert', `
            <p>Department <strong>${department}</strong> has reached <span style="color:${color};font-weight:bold">${utilization}%</span> of its monthly budget.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Spent</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600">₹${spent.toLocaleString()}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Limit</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600">₹${limit.toLocaleString()}</td></tr>
            </table>
        `),
    });
};

module.exports = { sendEmail, sendPOApprovalEmail, sendOverdueInvoiceEmail, sendBudgetAlertEmail };
