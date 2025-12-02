const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/user.repository");

// Middleware to protect routes that require authentication
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Properly handle JWT verification errors to prevent server crashes
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await userRepository.findById(decoded.id);

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);
      
      // Handle specific JWT errors
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ 
          message: "Token expired", 
          code: "TOKEN_EXPIRED",
          expiredAt: error.expiredAt 
        });
      } else if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ 
          message: "Invalid token", 
          code: "INVALID_TOKEN" 
        });
      } else {
        return res.status(401).json({ 
          message: "Not authorized, token failed",
          code: "AUTH_FAILED"
        });
      }
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Middleware to authorize based on roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user?.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// ✔ Add employee middleware
const allowViewEmployees = authorize("ADMIN", "HR", "FINANCE", "EMPLOYEE");
const allowManageEmployees = authorize("ADMIN", "HR");
const allowManagerAndAdmin = authorize("ADMIN", "HR");

module.exports = {
  protect,
  authorize,
  allowViewEmployees,
  allowManageEmployees,
  allowManagerAndAdmin,
};
