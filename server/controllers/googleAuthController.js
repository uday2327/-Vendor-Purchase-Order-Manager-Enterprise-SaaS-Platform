const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc  Google OAuth login — pre-existing users only
// @route POST /api/auth/google-login
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ message: 'Google credential required' });

        // Verify Google ID token
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch {
            return res.status(401).json({ message: 'Invalid or expired Google token' });
        }

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        if (!email) return res.status(400).json({ message: 'Email not available from Google' });

        // Find user by email — NO auto-creation
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(403).json({ message: 'Access Denied — No account found. Contact your administrator.' });
        }

        // Store googleId if not already set
        if (!user.googleId) {
            user.googleId = googleId;
            user.authProvider = 'google';
            await user.save();
        }

        // Generate JWT (include organizationId if available)
        const jwtPayload = { id: user._id, role: user.role };
        if (user.organizationId) jwtPayload.organizationId = user.organizationId;

        const token = jwt.sign(
            jwtPayload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Audit log
        await logAudit(user._id, 'CREATE', 'User', user._id, {
            action: 'GOOGLE_LOGIN',
            email: user.email,
            ip: req.ip,
        });

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                authProvider: 'google',
            },
        });
    } catch (error) {
        console.error('[Google Auth] Error:', error.message);
        res.status(500).json({ message: 'Authentication failed' });
    }
};

module.exports = { googleLogin };
