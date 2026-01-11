const leavePolicyService = require('../services/leavePolicy.service');

const createPolicy = async (req, res, next) => {
  try {
    const policy = await leavePolicyService.createPolicy(req.user, req.body);
    res.status(201).json(policy);
  } catch (error) {
    next(error);
  }
};

const getPolicies = async (req, res, next) => {
  try {
    const policies = await leavePolicyService.getPolicies(req.user, req.query);
    res.json(policies);
  } catch (error) {
    next(error);
  }
};

const updatePolicy = async (req, res, next) => {
  try {
    const policy = await leavePolicyService.updatePolicy(req.user, req.params.id, req.body);
    res.json(policy);
  } catch (error) {
    next(error);
  }
};

const deletePolicy = async (req, res, next) => {
  try {
    await leavePolicyService.deletePolicy(req.user, req.params.id);
    res.json({ message: "Policy deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getPolicyYears = async (req, res, next) => {
  try {
    const years = await leavePolicyService.getPolicyYears(req.user, req.query.officeId);
    res.json(years);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPolicy,
  getPolicies,
  updatePolicy,
  deletePolicy,
  getPolicyYears
};
