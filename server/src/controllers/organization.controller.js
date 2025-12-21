const prisma = require("../config/prisma");

/**
 * Get all Legal Entities (Super Admin only)
 */
const getAllLegalEntities = async (req, res) => {
  try {
    const entities = await prisma.legalEntity.findMany({
      include: {
        _count: {
          select: { offices: true, employees: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(entities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Legal Entity by ID
 */
const getLegalEntityById = async (req, res) => {
  try {
    const { id } = req.params;
    const entity = await prisma.legalEntity.findUnique({
      where: { id },
      include: {
        offices: true,
        _count: {
            select: { employees: true }
        }
      }
    });

    if (!entity) {
      return res.status(404).json({ message: "Legal entity not found" });
    }

    res.json(entity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new Legal Entity (Super Admin only)
 */
const createLegalEntity = async (req, res) => {
  try {
    const { name, countryCode, defaultCurrency, logoUrl } = req.body;

    const newEntity = await prisma.legalEntity.create({
      data: {
        name,
        countryCode,
        defaultCurrency,
        logoUrl
      }
    });

    res.status(201).json(newEntity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Update Legal Entity
 */
const updateLegalEntity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, countryCode, defaultCurrency, logoUrl } = req.body;

    const updatedEntity = await prisma.legalEntity.update({
      where: { id },
      data: {
        name,
        countryCode,
        defaultCurrency,
        logoUrl
      }
    });

    res.json(updatedEntity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Delete Legal Entity (Super Admin only - Dangerous!)
 */
const deleteLegalEntity = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it has employees or offices first?
    // Prisma cascade might handle it if configured, but safer to check.
    const entity = await prisma.legalEntity.findUnique({
        where: { id },
        include: { _count: { select: { employees: true } } }
    });

    if (entity._count.employees > 0) {
        return res.status(400).json({ message: "Cannot delete organization with active employees." });
    }

    await prisma.legalEntity.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllLegalEntities,
  getLegalEntityById,
  createLegalEntity,
  updateLegalEntity,
  deleteLegalEntity
};
