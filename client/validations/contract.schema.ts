import { z } from "zod";

export const contractSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACTUAL", "INTERN", "PROBATION"]),
  position: z.string().min(1, "Position is required"),
  department: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  salary: z.coerce.number().min(0, "Salary must be a positive number"),
  currency: z.string().min(1, "Currency is required"),
  isActive: z.boolean().optional(),
});

export type ContractFormValues = z.infer<typeof contractSchema>;
