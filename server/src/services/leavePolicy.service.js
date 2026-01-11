const leavePolicyRepository = require('../repositories/leavePolicy.repository');

/**
 * Validate that the new policy does not overlap with existing ones
 */
const validatePolicyOverlap = async (officeId, contractType, leaveTypeId, effectiveFrom, effectiveTo, excludeId = null) => {
    // Basic overlap finding
    const overlaps = await leavePolicyRepository.findOverlappingPolicies(
        officeId, 
        contractType, 
        leaveTypeId, 
        effectiveFrom, 
        effectiveTo, 
        excludeId
    );

    // Filter out archived policies from overlap check
    const activeOverlaps = overlaps.filter(p => !p.isArchived);

    if (activeOverlaps.length > 0) {
        throw new Error(`Invalid: Policy overlaps with an existing policy (${activeOverlaps[0].effectiveFrom.toISOString().split('T')[0]} - ${activeOverlaps[0].effectiveTo.toISOString().split('T')[0]})`);
    }
};

const createPolicy = async (user, data) => {
    const { officeId, contractType, leaveTypeId, effectiveFrom, effectiveTo, annualQuotaMinutes, carryForwardAllowed, maxCarryForwardMinutes } = data;
    
    // Permission Check: HR can only create for their office
    if (user.role === 'HR') {
        if (user.officeId !== officeId) {
            throw new Error("Access Denied: You can only create policies for your assigned office.");
        }
        
        // HR Check: Must be future policy
        const start = new Date(effectiveFrom);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0,0,0,0);

        if (start < tomorrow) {
             throw new Error("Access Denied: HR can only create leave policies for future dates (starting tomorrow).");
        }
    }

    const start = new Date(effectiveFrom);
    const end = effectiveTo ? new Date(effectiveTo) : new Date('2099-12-31');
    
    if (start > end) {
        throw new Error("Invalid: Effective From date cannot be after Effective To date.");
    }

    await validatePolicyOverlap(officeId, contractType, leaveTypeId, start, end);

    return await leavePolicyRepository.create({
        officeId,
        contractType,
        leaveTypeId,
        effectiveFrom: start,
        effectiveTo: end,
        annualQuotaMinutes,
        carryForwardAllowed: carryForwardAllowed || false,
        maxCarryForwardMinutes: maxCarryForwardMinutes || null,
        createdByRole: user.role,
        isArchived: false
    });
};

const getPolicies = async (user, query) => {
    const policies = await leavePolicyRepository.findAll(query);
    
    // Admin Toggle: If includeArchived=true, return all.
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        if (query.includeArchived === 'true') {
            return policies;
        }
    }
    
    // Default: Filter out archived
    return policies.filter(p => !p.isArchived);
};

const getPolicyYears = async (user, officeId) => {
    const policies = await leavePolicyRepository.findDistinctYears(officeId || user.officeId);
    
    // Process into Map: Year -> Status
    const yearMap = new Map();
    const today = new Date();
    today.setHours(0,0,0,0);

    policies.forEach(p => {
        const year = p.effectiveFrom.getFullYear();
        if (!yearMap.has(year)) {
            yearMap.set(year, { year, hasActive: false, hasFuture: false, hasArchived: false });
        }
        
        const status = yearMap.get(year);
        
        if (p.isArchived) {
            status.hasArchived = true;
        } else if (p.effectiveFrom > today) {
            status.hasFuture = true;
        } else {
            // effectiveFrom <= today (and not archived) -> Active
            status.hasActive = true;
        }
    });

    // Convert to Array
    const years = Array.from(yearMap.values()).sort((a, b) => b.year - a.year); // Descending

    // Role Filtering
    if (user.role === 'HR') {
        // HR only sees years with Active OR Future policies
        return years.filter(y => y.hasActive || y.hasFuture);
    }

    // Admin sees ALL years
    return years;
};

const updatePolicy = async (user, id, data) => {
     const existing = await leavePolicyRepository.findById(id);
     if (!existing) throw new Error("Policy not found");

     // Permission Check
     if (user.role === 'HR') {
         if (user.officeId !== existing.officeId) {
            throw new Error("Access Denied: You cannot edit policies of another office.");
         }
         
         // HR Check: Cannot edit Active or Past policies
         // Active = EffectiveFrom <= today
         const today = new Date();
         today.setHours(0,0,0,0);
         const policyStart = new Date(existing.effectiveFrom);
         
         if (policyStart <= today) {
             throw new Error("Access Denied: HR can only edit future-dated policies.");
         }
     }

     // Prevent editing past policies for everyone (or specifically HR? Plan says Admin ✅ for past)
     // Keep Admin power to edit past if needed for corrections, but warn?
     // For now, stick to user requirement: "Admin ✅ Edit (past & future), HR ❌ Past/Active" -> Done above.

     // Overlap Check (if any defining fields change)
     if (data.contractType || data.leaveTypeId || data.effectiveFrom || data.effectiveTo) {
         const officeId = existing.officeId; // Office shouldn't change typically, but if it did, we'd need it here.
         const contractType = data.contractType || existing.contractType;
         const leaveTypeId = data.leaveTypeId || existing.leaveTypeId;
         const start = data.effectiveFrom ? new Date(data.effectiveFrom) : existing.effectiveFrom;
         const end = data.effectiveTo ? new Date(data.effectiveTo) : existing.effectiveTo;
         
         await validatePolicyOverlap(officeId, contractType, leaveTypeId, start, end, id);
     }

     // Prepare update data with correct types
     const updateData = { ...data };
     
     // Remove non-schema fields
     delete updateData.annualQuotaDays;

     // Convert dates to objects
     if (updateData.effectiveFrom) {
         updateData.effectiveFrom = new Date(updateData.effectiveFrom);
     }
     if (updateData.effectiveTo) {
         updateData.effectiveTo = new Date(updateData.effectiveTo);
     }

     return await leavePolicyRepository.update(id, updateData);
};

const deletePolicy = async (user, id) => {
    // "Delete Policy: Admin ✅, HR ❌"
    if (user.role === 'HR') {
        throw new Error("Access Denied: Only Admins can delete/archive policies.");
    }

    // Soft Delete (Archive)
    return await leavePolicyRepository.update(id, {
        isArchived: true,
        archivedAt: new Date(),
        archivedByRole: user.role
    });
};

const getPolicyForDate = async (officeId, contractType, leaveTypeId, date) => {
    return await leavePolicyRepository.findPolicyForDate(officeId, contractType, leaveTypeId, date);
};

module.exports = {
  createPolicy,
  getPolicies,
  updatePolicy,
  deletePolicy,
  deletePolicy,
  getPolicyForDate,
  getPolicyYears
};
