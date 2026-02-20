/**
 * Global Error Handler Middleware
 * Centralized error handling for all routes
 */

const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method
    });
    
    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let success = false;
    
    // MySQL/TiDB specific errors
    if (err.code) {
        switch (err.code) {
            case 'ER_DUP_ENTRY':
                statusCode = 400;
                message = 'Duplicate entry. This record already exists.';
                break;
            case 'ER_NO_REFERENCED_ROW':
            case 'ER_ROW_IS_REFERENCED_2':
                statusCode = 400;
                message = 'Cannot perform this action. Related records exist.';
                break;
            case 'ER_BAD_FIELD_ERROR':
                statusCode = 400;
                message = 'Invalid field name in database query.';
                break;
            default:
                // Keep original error for other codes
                break;
        }
    }
    
    // Validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.message;
    }
    
    // Send error response
    res.status(statusCode).json({
        success,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
