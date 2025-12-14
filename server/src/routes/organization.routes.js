const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organization.controller");
const { protect: authenticateToken, authorize: authorizeRoles } = require("../middlewares/auth.middleware");

// All routes require Super Admin except maybe getting details if we allow Admin to see their own org configs
// But for now, let's strict it to SUPER_ADMIN for management.

router.use(authenticateToken);

// Tenant Management (Global)
router.get("/", authorizeRoles("SUPER_ADMIN"), organizationController.getAllLegalEntities);
router.post("/", authorizeRoles("SUPER_ADMIN"), organizationController.createLegalEntity);
router.get("/:id", authorizeRoles("SUPER_ADMIN", "ADMIN", "HR"), organizationController.getLegalEntityById); // Admins might need to see their own
router.put("/:id", authorizeRoles("SUPER_ADMIN"), organizationController.updateLegalEntity); 
router.delete("/:id", authorizeRoles("SUPER_ADMIN"), organizationController.deleteLegalEntity);


module.exports = router;
