const User = require('../models/User');

const bootstrapAdmin = async () => {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME?.trim() || 'Admin';

    if (!email || !password) {
        return;
    }

    if (password.length < 6) {
        console.warn('[Bootstrap] ADMIN_PASSWORD must be at least 6 characters. Admin user was not created.');
        return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
        if (existing.role !== 'admin') {
            existing.role = 'admin';
            await existing.save();
            console.log(`[Bootstrap] Promoted ${email} to admin.`);
        }
        return;
    }

    await User.create({
        name,
        email,
        password,
        role: 'admin',
    });

    console.log(`[Bootstrap] Created admin user ${email}.`);
};

module.exports = bootstrapAdmin;
