import React, { useState } from "react";
import { toast } from "sonner";
import Button from "../ui/Button";
import FourSquare from "../ui/FourSquare";
import FormField from "../ui/FormField";
import { useAppContext } from "../../contexts/AppContext";
import { View, Role } from "../../types";
import { employeeSchema } from "@/validations/employeeValidation";

const initialEmployeeState = {
  name: "",
  email: "",
  position: "Software Engineer",
  department: "Technology",
  role: Role.EMPLOYEE,
  password: "", // Required for creation
  status: "Active",
  hireDate: new Date().toISOString().substring(0, 10),
  nid: "",
  bankDetails: "",
};

type FormKeys = keyof typeof initialEmployeeState;

const AddEmployeeForm: React.FC = () => {
  const { setView, addEmployee, loading } = useAppContext();
  const [formData, setFormData] = useState(initialEmployeeState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

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
    const validationResult = employeeSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string | undefined> = {};

      validationResult.error.issues.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0] as FormKeys] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please correct the highlighted form errors.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await addEmployee(validationResult.data);

      toast.success(`Employee ${formData.name} successfully created!`);
      setView(View.EMPLOYEES);
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 border-b pb-4 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Create New Employee Profile
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView(View.EMPLOYEES)}
            aria-label="Close form"
            disabled={isFormLoading}
          >
            {/* Inline SVG for Close icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </Button>
        </header>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
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
                label="Initial Password"
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
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

            {/* Status (Display only) */}
            <div className="bg-indigo-50 p-3 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-700">
                Status
              </span>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-200 text-green-800">
                {formData.status}
              </span>
            </div>

            <div className="pt-4 border-t flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setView(View.EMPLOYEES)}
                disabled={isFormLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700"
                disabled={isFormLoading}
              >
                {isSubmitting && (
                  <FourSquare
                    size={16}
                    color={["#ffffff", "#ffffff", "#ffffff", "#ffffff"]}
                  />
                )}
                <span>
                  {isSubmitting ? "Adding Employee..." : "Add Employee"}
                </span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeForm;
