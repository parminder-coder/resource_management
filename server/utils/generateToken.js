const jwt = require('jsonwebtoken');

function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'resourcehub_super_secret_key_2026',
        { expiresIn: '7d' }
    );
}

module.exports = generateToken;
