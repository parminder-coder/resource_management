const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Protect routes — require valid JWT
async function protect(req, res, next) {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [rows] = await pool.query('SELECT id, first_name, last_name, email, role, status FROM users WHERE id = ?', [decoded.id]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = rows[0];
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
}

// Restrict to specific roles
function authorize(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized for this action' });
        }
        next();
    };
}

module.exports = { protect, authorize };
