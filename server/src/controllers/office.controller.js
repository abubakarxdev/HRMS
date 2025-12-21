const prisma = require("../config/prisma");

/**
 * Get all offices for the current user's legal entity
 */
const getOffices = async (req, res) => {
  try {
    const { legalEntityId: paramId } = req.params; // If passed as param?
    // Actually, we use req.user.
    const legalEntityId = req.user.employee?.legalEntityId || req.user.legalEntityId;

    if (!legalEntityId && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: "No Legal Entity associated with this user." });
    }

    const where = {};
    if (req.user.role !== 'SUPER_ADMIN') {
        where.legalEntityId = legalEntityId;
    }

    const offices = await prisma.office.findMany({
      where,
      include: {
        _count: {
          select: { employees: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(offices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new Office
 */
const createOffice = async (req, res) => {
  try {
    // If not Super Admin, force create for own entity
    const legalEntityId = req.user.role === 'SUPER_ADMIN' ? req.body.legalEntityId : (req.user.employee?.legalEntityId || req.user.legalEntityId);

    if (!legalEntityId) {
         return res.status(400).json({ message: "Legal Entity ID is required." });
    }

    const { name, address, timezone } = req.body;

    const newOffice = await prisma.office.create({
      data: {
        legalEntityId,
        name,
        address,
        timezone: timezone || 'Asia/Karachi' // Default if not provided
      }
    });

    res.status(201).json(newOffice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Update Office
 */
const updateOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, timezone } = req.body;
    const { role } = req.user;
    const legalEntityId = req.user.employee?.legalEntityId || req.user.legalEntityId;

    // Security check: Ensure Admin owns this office
    const office = await prisma.office.findUnique({ where: { id } });
    if (!office) return res.status(404).json({ message: "Office not found" });

    if (role !== 'SUPER_ADMIN' && office.legalEntityId !== legalEntityId) {
        return res.status(403).json({ message: "Access denied." });
    }

    const updatedOffice = await prisma.office.update({
      where: { id },
      data: {
        name,
        address,
        timezone
      }
    });

    res.json(updatedOffice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Delete Office
 */
const deleteOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;
    const legalEntityId = req.user.employee?.legalEntityId || req.user.legalEntityId;

    const office = await prisma.office.findUnique({ 
        where: { id },
        include: { _count: { select: { employees: true } } }
    });
    
    if (!office) return res.status(404).json({ message: "Office not found" });

    if (role !== 'SUPER_ADMIN' && office.legalEntityId !== legalEntityId) {
        return res.status(403).json({ message: "Access denied." });
    }

    if (office._count.employees > 0) {
        return res.status(400).json({ message: "Cannot delete office with active employees." });
    }

    await prisma.office.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOffices,
  createOffice,
  updateOffice,
  deleteOffice
};
