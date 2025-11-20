import { z } from "zod";
import { Role } from "../types";

export const employeeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  email: z.string().email().refine(() => true, {
    message: "Invalid email address format."
  }),

  position: z.string().min(1, "Position is required."),
  department: z.string().min(1, "Department is required."),

  role: z.enum([Role.EMPLOYEE, Role.MANAGER, Role.ADMIN_HR]).refine(
    (val) => Object.values(Role).includes(val),
    { message: "A valid role must be selected." }
  ),

  password: z.string().min(8, "Password must be at least 8 characters."),

  status: z.string(),

  hireDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)."),

  nid: z.string().optional().or(z.literal("")),
  bankDetails: z.string().optional().or(z.literal(""))
});

export type EmployeeFormInput = z.infer<typeof employeeSchema>;