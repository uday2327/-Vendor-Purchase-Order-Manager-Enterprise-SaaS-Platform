const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../utils/auditLogger');

// @desc    Get all users (admin only)
const getUsers = async (req, res) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (role) query.role = role;

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password -twoFactorSecret')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create user (admin only)
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required' });

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already registered' });

        const user = await User.create({ name, email, password, role: role || 'viewer' });
        await logAudit(req.user._id, 'CREATE', 'User', user._id, { name, email, role: role || 'viewer' });

        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.twoFactorSecret;
        res.status(201).json(userObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user (admin only)
const updateUser = async (req, res) => {
    try {
        const { name, email, role, enable2FA } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (enable2FA !== undefined) user.enable2FA = enable2FA;

        await user.save();
        await logAudit(req.user._id, 'UPDATE', 'User', user._id, { name, email, role });

        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.twoFactorSecret;
        res.json(userObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user (admin only)
const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await logAudit(req.user._id, 'DELETE', 'User', req.params.id, { name: user.name, email: user.email });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset user password (admin only)
const resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.password = newPassword;
        await user.save();
        await logAudit(req.user._id, 'UPDATE', 'User', user._id, { action: 'password_reset' });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, resetPassword };
