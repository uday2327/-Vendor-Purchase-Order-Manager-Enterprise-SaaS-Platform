const express = require('express');
const router = express.Router();
const { login, register, getMe } = require('../controllers/authController');
const { googleLogin } = require('../controllers/googleAuthController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.post('/google-login', googleLogin);
router.get('/me', protect, getMe);

module.exports = router;
