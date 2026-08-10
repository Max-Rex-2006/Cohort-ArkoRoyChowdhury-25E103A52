const jwt = require('jsonwebtoken');

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

module.exports = authenticateToken;