/**
 * Role-Based Access Control Middleware
 * Restricts access based on user role
 */

const roleCheck = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user exists (should be set by auth middleware)
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        // Check if user's role is allowed
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }
        
        next();
    };
};

module.exports = roleCheck;
