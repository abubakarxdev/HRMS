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

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await userRepository.findById(decoded.id);

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
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
const allowViewEmployees = authorize("ADMIN_HR", "MANAGER", "EMPLOYEE");
const allowManageEmployees = authorize("ADMIN_HR");
const allowManagerAndAdmin = authorize("ADMIN_HR", "MANAGER");

module.exports = {
  protect,
  authorize,
  allowViewEmployees,
  allowManageEmployees,
  allowManagerAndAdmin,
};
