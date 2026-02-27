/**
 * Role-Based Access Control Middleware
 *
 * Roles hierarchy:
 *   admin      → full access (all CRUD on everything)
 *   manager    → vendors + purchase orders (read + write)
 *   accountant → invoices (read + write), dashboard (read)
 *   viewer     → read-only access to everything
 */

// Allow only specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res
                .status(401)
                .json({ message: 'Not authorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Role '${req.user.role}' is not authorized for this action.`,
            });
        }

        next();
    };
};

// Allow read access for all roles, but write only for specified roles
const readAllWriteFor = (...writeRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const readMethods = ['GET', 'HEAD', 'OPTIONS'];

        // All authenticated users can read
        if (readMethods.includes(req.method)) {
            return next();
        }

        // Only specified roles can write
        if (!writeRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Role '${req.user.role}' does not have write permission.`,
            });
        }

        next();
    };
};

module.exports = { authorize, readAllWriteFor };
