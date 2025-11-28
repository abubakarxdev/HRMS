import { z } from "zod";
import { Role } from "../types";

export const employeeSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  workEmail: z.string().email("Invalid work email address."),
  personalEmail: z.string().email("Invalid personal email address.").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),

  position: z.string().min(1, "Position is required."),
  department: z.string().min(1, "Department is required."),

  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: "A valid role must be selected." })
  }),

  password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal("")),

  status: z.string(),

  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)."),

  nid: z.string().optional().or(z.literal("")),
  bankDetails: z.string().optional().or(z.literal("")),

  // Address fields (stored in personalDetails)
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
});

export type EmployeeFormInput = z.infer<typeof employeeSchema>;