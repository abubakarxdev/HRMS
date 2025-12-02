import { useQuery } from '@tanstack/react-query';
import { auditService } from '../api/services/audit.service';
import { queryKeys } from '../lib/queryClient';

export const useEmployeeAuditLogs = (employeeId: string) => {
  return useQuery({
    queryKey: queryKeys.auditLogs.byEmployee(employeeId),
    queryFn: () => auditService.getByEmployeeId(employeeId),
    enabled: !!employeeId,
  });
};
