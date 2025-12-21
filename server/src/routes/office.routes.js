const express = require("express");
const router = express.Router();
const officeController = require("../controllers/office.controller");
const { protect: authenticateToken, authorize: authorizeRoles } = require("../middlewares/auth.middleware");

router.use(authenticateToken);

// Accessible by Admin and Super Admin
router.get("/", authorizeRoles("ADMIN", "SUPER_ADMIN", "HR"), officeController.getOffices);
router.post("/", authorizeRoles("ADMIN", "SUPER_ADMIN"), officeController.createOffice);
router.put("/:id", authorizeRoles("ADMIN", "SUPER_ADMIN"), officeController.updateOffice);
router.delete("/:id", authorizeRoles("ADMIN", "SUPER_ADMIN"), officeController.deleteOffice);

module.exports = router;
