import { useQuery } from '@tanstack/react-query';
import { leavesService } from '../api/services/leaves.service';

export const useLeaveTypes = (officeId?: string) => {
  return useQuery({
    queryKey: ['leave-types', officeId],
    queryFn: () => leavesService.getLeaveTypes(officeId),
    enabled: !officeId || !!officeId // Always run? Or wait for officeId? 
    // If officeId is undefined, it might fetch "current user's office types" which is fine for HR. 
    // Admin needs to select office first.
  });
};
