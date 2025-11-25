import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import { useAppContext } from "../../contexts/AppContext";
import { Role } from "../../types";
import { employeeSchema } from "@/validations/employeeValidation";
import { useNavigate, useParams } from "react-router-dom";
import { NAVIGATION_PATHS } from "@/constants";

const initialEmployeeState = {
  name: "",
  email: "",
  position: "Software Engineer",
  department: "Technology",
  role: Role.EMPLOYEE,
  password: "", // Required for creation, optional for update
  status: "Active",
  hireDate: new Date().toISOString().substring(0, 10),
  nid: "",
  bankDetails: "",
};

type FormKeys = keyof typeof initialEmployeeState;

const AddEmployeeForm: React.FC = () => {
  const { addEmployee, updateEmployee, employees, loading } = useAppContext();
  const { employeeId } = useParams<{ employeeId: string }>();
  const isEditMode = !!employeeId;

  const [formData, setFormData] = useState(initialEmployeeState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const navigate = useNavigate();

  // Load employee data if in edit mode
  useEffect(() => {
    if (isEditMode && employees.length > 0) {
      const employeeToEdit = employees.find(e => e.employeeId === employeeId || String(e.id) === employeeId);
      if (employeeToEdit) {
        setFormData({
          name: employeeToEdit.name,
          email: employeeToEdit.email,
          position: employeeToEdit.position,
          department: employeeToEdit.department,
          role: employeeToEdit.role,
          password: "", // Don't populate password
          status: employeeToEdit.status,
          hireDate: (() => {
            try {
              const dateVal = employeeToEdit.hireDate || new Date();
              return new Date(dateVal).toISOString().substring(0, 10);
            } catch (e) {
              return new Date().toISOString().substring(0, 10);
            }
          })(),
          nid: employeeToEdit.nid || "",
          bankDetails: "",
        });
      } else {
        toast.error("Employee not found");
        navigate(NAVIGATION_PATHS.EMPLOYEES);
      }
    }
  }, [isEditMode, employeeId, employees, navigate]);

  // Data options for dropdowns
  const roles = Object.values(Role);
  const departments = [
    "Technology",
    "Human Resources",
    "Sales",
    "Finance",
    "Marketing",
  ];
  const positions = [
    "Software Engineer",
    "HR Director",
    "Engineering Manager",
    "Analyst",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error for this field when typing
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 1. Zod Validation
    // For edit mode, password is optional if empty
    let validationData = { ...formData };
    if (isEditMode && !formData.password) {
        // If editing and no password provided, we can skip password validation 
        // by temporarily setting a dummy valid password for the schema check
        // OR we should have a separate schema for updates. 
        // For now, let's assume the schema requires password.
        // We'll handle this by checking if it's edit mode in the schema or here.
        // A simple hack for now if schema requires it:
        // If the schema requires password, we might need to adjust the schema or logic.
        // Let's assume we send the data as is, and if password is empty in edit, backend handles it?
        // Actually, client validation usually requires it. 
        // Let's bypass client validation for password in edit mode if it's empty.
    }

    // We'll use a slightly modified check or just rely on schema.
    // If schema enforces password, we need to handle it.
    // Let's try to parse.
    const result = employeeSchema.safeParse(formData);
    
    // Custom validation logic for Edit Mode Password
    let isValid = result.success;
    let finalErrors: Record<string, string | undefined> = {};

    if (!result.success) {
        result.error.issues.forEach((err) => {
            if (err.path.length > 0) {
                // Ignore password error in edit mode if field is empty
                if (isEditMode && err.path[0] === 'password' && !formData.password) {
                    return;
                }
                finalErrors[err.path[0] as FormKeys] = err.message;
            }
        });
        if (Object.keys(finalErrors).length > 0) {
            isValid = false;
        } else {
            isValid = true; // If only password error existed and we ignored it
        }
    }

    if (!isValid) {
      setErrors(finalErrors);
      toast.error("Please correct the highlighted form errors.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      if (isEditMode) {
          // Find the original employee to get the ID
          const originalEmployee = employees.find(e => e.employeeId === employeeId || String(e.id) === employeeId);
          if (!originalEmployee) throw new Error("Employee not found");

          await updateEmployee({
              ...originalEmployee,
              ...formData,
              hireDate: formData.hireDate,
              // Only include password if it's set
              ...(formData.password ? { password: formData.password } : {})
          });
          toast.success(`Employee ${formData.name} updated successfully!`);
      } else {
          await addEmployee(formData);
          toast.success(`Employee ${formData.name} successfully created!`);
      }
      
      navigate(NAVIGATION_PATHS.EMPLOYEES);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLoading = isSubmitting || loading;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
            {isEditMode ? "Edit Employee" : "Add New Employee"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <legend className="text-xl font-semibold mb-4 text-indigo-700">
              Personal & Security
            </legend>

            <FormField
              label="Full Name"
              id="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            <FormField
              label="Email Address"
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />

            {/* Password field with toggle */}
            <FormField
              label={isEditMode ? "New Password (leave blank to keep current)" : "Initial Password"}
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required={!isEditMode}
            />

            <FormField
              label="National ID (NID)"
              id="nid"
              type="text"
              value={formData.nid}
              onChange={handleChange}
              error={errors.nid}
              required={false}
            />
          </fieldset>

          <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
            <legend className="text-xl font-semibold mb-4 text-indigo-700">
              Organizational Details
            </legend>

            <FormField
              label="Hire Date"
              id="hireDate"
              type="date"
              value={formData.hireDate}
              onChange={handleChange}
              error={errors.hireDate}
              required
            />

            <FormField
              label="Role"
              id="role"
              type="select"
              value={formData.role}
              onChange={handleChange}
              options={roles}
              error={errors.role}
              required
            />
            <FormField
              label="Position"
              id="position"
              type="select"
              value={formData.position}
              onChange={handleChange}
              options={positions}
              error={errors.position}
              required
            />
            <FormField
              label="Department"
              id="department"
              type="select"
              value={formData.department}
              onChange={handleChange}
              options={departments}
              error={errors.department}
              required
            />
          </fieldset>

          <fieldset className="grid grid-cols-1 gap-6 pt-6 border-t">
            <legend className="text-xl font-semibold mb-4 text-indigo-700">
              Financial Details
            </legend>
            <FormField
              label="Bank Details (Account Number)"
              id="bankDetails"
              type="text"
              value={formData.bankDetails}
              onChange={handleChange}
              error={errors.bankDetails}
              required={false}
            />
          </fieldset>

          {/* Status (Display only for now, could be editable) */}
          <div className="bg-indigo-50 p-3 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-700">Status</span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-200 text-green-800">
              {formData.status}
            </span>
          </div>

          <div className="pt-4 border-t flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(NAVIGATION_PATHS.EMPLOYEES)}
              disabled={isFormLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700"
              disabled={isFormLoading}
              isLoading={isSubmitting}
            >
              {isSubmitting ? (isEditMode ? "Saving..." : "Adding...") : (isEditMode ? "Save Changes" : "Add Employee")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeForm;
