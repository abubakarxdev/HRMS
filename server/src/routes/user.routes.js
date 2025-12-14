const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect: authenticateToken, authorize: authorizeRoles } = require("../middlewares/auth.middleware");

router.use(authenticateToken);

// Only Super Admin can manage platform users
router.get("/", authorizeRoles("SUPER_ADMIN"), userController.getUsers);
router.post("/", authorizeRoles("SUPER_ADMIN"), userController.createUser);
router.put("/:id", authorizeRoles("SUPER_ADMIN"), userController.updateUser);
router.delete("/:id", authorizeRoles("SUPER_ADMIN"), userController.deleteUser);

module.exports = router;
