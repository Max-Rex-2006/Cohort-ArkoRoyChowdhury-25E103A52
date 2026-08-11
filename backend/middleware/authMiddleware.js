const jwt = require('jsonwebtoken');
const dp = require('../config/connection.js');

// ============================================================
// AUTHENTICATION
// ============================================================

const authenticateToken = (req, res, next) => {
    // Extract token from HTTP-only cookie (or Authorization header as fallback)
  const token =
    req.cookies?.token ||
    (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    // Verify token validity and expiration using secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach decoded user info to request object
    req.user = decoded;
    
    // Pass control to next controller handler
    next();
  } catch (error) {
    return res.status(403).json({
      status: 'fail',
      message: 'Invalid or expired token.',
    });
  }
};

// ============================================================
// SYSTEM-LEVEL AUTHORIZATION
// ============================================================

// Allow only the website administrator
const requireAdmin = (req, res, next) => {

    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            status: 'fail',
            message: 'Admin access required.'
        });
    }

    next();
};

// ============================================================
// PROJECT-LEVEL AUTHORIZATION
// ============================================================

// Allow Project Admins
const requireProjectAdmin = async (req, res, next) => {

    const userID = req.user?.id;
    const projectID = req.params.projectId;

    if (!userID || !projectID) {
        return res.status(400).json({
            status: 'fail',
            message: 'User ID and project ID are required.'
        });
    }

    // Global website admin bypasses project membership check
    if (req.user?.role === 'admin') {
        return next();
    }

    try {

        const query = `
            SELECT role
            FROM project_members
            WHERE user_id = $1
              AND project_id = $2;
        `;

        const result = await dp.query(query, [
            userID,
            projectID
        ]);

        if (
            result.rows.length === 0 ||
            result.rows[0].role !== 'admin'
        ) {
            return res.status(403).json({
                status: 'fail',
                message: 'Project admin access required.'
            });
        }

        next();

    } catch (error) {

        return res.status(500).json({
            status: 'error',
            message: 'Failed to verify project permissions.',
            error: error.message || error
        });
    }
};

// ============================================================
// PROJECT MEMBERSHIP AUTHORIZATION
// ============================================================

// Allow users who belong to the project
const requireProjectMember = async (req, res, next) => {

    const userID = req.user?.id;
    const projectID = req.params.projectId;

    if (!userID || !projectID) {
        return res.status(400).json({
            status: 'fail',
            message: 'User ID and project ID are required.'
        });
    }

    // Global website admin bypasses project membership check
    if (req.user?.role === 'admin') {
        return next();
    }

    try {

        const query = `
            SELECT role
            FROM project_members
            WHERE user_id = $1
              AND project_id = $2;
        `;

        const result = await dp.query(query, [
            userID,
            projectID
        ]);

        if (result.rows.length === 0) {
            return res.status(403).json({
                status: 'fail',
                message: 'You are not a member of this project.'
            });
        }

        // Optional: make the project role available
        // to the controller
        req.projectRole = result.rows[0].role;

        next();

    } catch (error) {

        return res.status(500).json({
            status: 'error',
            message: 'Failed to verify project membership.',
            error: error.message || error
        });
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireProjectAdmin,
    requireProjectMember
};