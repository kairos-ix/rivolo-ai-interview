/**
 * Middleware to authorize specific roles
 * @param  {...string} roles - Roles allowed to access the route
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized. Role not found.' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this route.` 
      });
    }
    
    next();
  };
};

/**
 * Middleware to authorize specific granular permissions (for future scalability)
 * @param  {...string} permissions - Permissions required to access the route
 */
const authorizePermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(401).json({ message: 'Unauthorized. Permissions not found.' });
    }
    
    const hasPermission = permissions.every(p => req.user.permissions.includes(p));
    
    if (!hasPermission && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Forbidden. You lack the required permissions.' 
      });
    }
    
    next();
  };
};

module.exports = { authorizeRoles, authorizePermissions };
