import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { 
  User, Briefcase, Mail, Phone, MapPin, 
  CreditCard, Calendar, Shield, Camera, 
  CheckCircle2, AlertCircle, ArrowLeft 
} from "lucide-react";

import Button from "../ui/Button";
import FormField from "../ui/FormField";
import Card from "../ui/Card";
import { useEmployees, useCreateEmployee, useUpdateEmployee } from "../../hooks/useEmployees";
import { Role } from "../../types";
import { employeeSchema } from "@/validations/employeeValidation";
import { NAVIGATION_PATHS } from "@/constants";

const initialEmployeeState = {
  firstName: "",
  lastName: "",
  workEmail: "",
  personalEmail: "",
  phone: "",
  
  // Employment
  position: "Software Engineer",
  department: "Technology",
  joiningDate: new Date().toISOString().substring(0, 10),
  status: "Active",
  
  // Address
  address: "",
  city: "",
  country: "",
  
  // Account
  role: Role.EMPLOYEE,
  password: "",
  
  // Financial
  nid: "",
  bankDetails: "",
};

type FormKeys = keyof typeof initialEmployeeState;

const AddEmployeeForm: React.FC = () => {
  const { data: employees = [], isLoading: loading } = useEmployees();
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  
  const { employeeId } = useParams<{ employeeId: string }>();
  const isEditMode = !!employeeId;

  const [formData, setFormData] = useState(initialEmployeeState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const navigate = useNavigate();

  // Load employee data if in edit mode
  useEffect(() => {
    if (isEditMode && employees.length > 0) {
      const employeeToEdit = employees.find(e => e.id === employeeId);
      if (employeeToEdit) {
        // Extract details from personalDetails JSON if available
        const personalDetails = employeeToEdit.personalDetails as any || {};
        
        setFormData({
          firstName: employeeToEdit.firstName,
          lastName: employeeToEdit.lastName,
          workEmail: employeeToEdit.workEmail,
          personalEmail: employeeToEdit.personalEmail || "",
          phone: personalDetails.phone || "",
          
          position: personalDetails.position || "Software Engineer",
          department: personalDetails.department || "Technology",
          joiningDate: (() => {
            try {
              const dateVal = employeeToEdit.joiningDate || new Date();
              return new Date(dateVal).toISOString().substring(0, 10);
            } catch (e) {
              return new Date().toISOString().substring(0, 10);
            }
          })(),
          status: employeeToEdit.status,
          
          address: personalDetails.address || "",
          city: personalDetails.city || "",
          country: personalDetails.country || "",
          
          role: employeeToEdit.user?.role as Role || Role.EMPLOYEE,
          password: "", // Don't populate password
          
          nid: employeeToEdit.nid || "", // Assuming nid might be added to schema later or in personalDetails
          bankDetails: JSON.stringify(employeeToEdit.bankDetails) || "",
        });
      } else {
        toast.error("Employee not found");
        navigate(NAVIGATION_PATHS.EMPLOYEES);
      }
    }
  }, [isEditMode, employeeId, employees, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate
    const result = employeeSchema.safeParse(formData);
    
    let isValid = result.success;
    let finalErrors: Record<string, string | undefined> = {};

    if (!result.success) {
        result.error.issues.forEach((err) => {
            if (err.path.length > 0) {
                // Ignore password error in edit mode if field is empty
                if (isEditMode && err.path[0] === 'password' && !formData.password) {
                    return;
                }
                finalErrors[err.path[0] as string] = err.message;
            }
        });
    }

    // Manual validation for password in create mode
    if (!isEditMode && !formData.password) {
        finalErrors.password = "Password is required for new employees.";
    }

    if (Object.keys(finalErrors).length > 0) {
        isValid = false;
    } else {
        isValid = true;
    }

    if (!isValid) {
      setErrors(finalErrors);
      toast.error("Please check the form for errors.");
      // Scroll to top error
      const firstError = document.querySelector('.text-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Construct payload
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        workEmail: formData.workEmail,
        personalEmail: formData.personalEmail || null,
        joiningDate: formData.joiningDate,
        status: formData.status,
        
        // User account
        email: formData.workEmail, // User email = Work email
        role: formData.role,
        password: formData.password,
        
        // JSON fields
        personalDetails: {
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          position: formData.position,
          department: formData.department,
        },
        bankDetails: formData.bankDetails ? { accountNumber: formData.bankDetails } : null,
      };

      if (isEditMode) {
          const originalEmployee = employees.find(e => e.id === employeeId);
          if (!originalEmployee) throw new Error("Employee not found");

          await updateEmployeeMutation.mutateAsync({
              id: originalEmployee.id,
              data: {
                ...payload,
                // Only include password if set
                ...(formData.password ? { password: formData.password } : {})
              }
          });
          // Success toast handled in hook
      } else {
          await createEmployeeMutation.mutateAsync(payload);
          // Success toast handled in hook
      }
      
      navigate(NAVIGATION_PATHS.EMPLOYEES);
    } catch (err) {
      console.error(err);
      // Error toast handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLoading = isSubmitting || loading || createEmployeeMutation.isPending || updateEmployeeMutation.isPending;

  // Options
  const roles = Object.values(Role);
  const departments = ["Technology", "Human Resources", "Sales", "Finance", "Marketing", "Operations"];
  const positions = ["Software Engineer", "Senior Software Engineer", "Product Manager", "HR Manager", "Sales Representative", "Accountant", "Director"];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={() => navigate(NAVIGATION_PATHS.EMPLOYEES)}
            className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Directory
          </button>
          <h1 className="text-3xl font-bold text-slate-900">
            {isEditMode ? "Edit Employee Profile" : "Add New Employee"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEditMode ? "Update employee information and settings." : "Create a new employee account and profile."}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate(NAVIGATION_PATHS.EMPLOYEES)}
            disabled={isFormLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isFormLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
          >
            {isEditMode ? "Save Changes" : "Create Employee"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Navigation/Summary (Optional, keeping it simple for now) */}
        
        {/* Main Form Area */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* 1. Personal Information */}
          <Card className="overflow-hidden border-0 shadow-md ring-1 ring-slate-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Personal Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="First Name"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                required
                placeholder="e.g. John"
              />
              <FormField
                label="Last Name"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                required
                placeholder="e.g. Doe"
              />
              <FormField
                label="Personal Email"
                id="personalEmail"
                name="personalEmail"
                type="email"
                value={formData.personalEmail}
                onChange={handleChange}
                error={errors.personalEmail}
                placeholder="john.doe@gmail.com"
                icon={<Mail className="w-4 h-4 text-slate-400" />}
              />
              <FormField
                label="Phone Number"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="+1 (555) 000-0000"
                icon={<Phone className="w-4 h-4 text-slate-400" />}
              />
            </div>
            
            <div className="px-6 pb-6 pt-2">
              <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-slate-400" /> Address Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <FormField
                    label="Street Address"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    error={errors.address}
                    placeholder="123 Main St, Apt 4B"
                  />
                </div>
                <FormField
                  label="City"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  error={errors.city}
                  placeholder="New York"
                />
                <FormField
                  label="Country"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  error={errors.country}
                  placeholder="USA"
                />
              </div>
            </div>
          </Card>

          {/* 2. Employment Details */}
          <Card className="overflow-hidden border-0 shadow-md ring-1 ring-slate-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Employment Details</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Work Email"
                id="workEmail"
                name="workEmail"
                type="email"
                value={formData.workEmail}
                onChange={handleChange}
                error={errors.workEmail}
                required
                placeholder="john.doe@company.com"
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                helperText="This will be used as the username for login."
              />
              <FormField
                label="Joining Date"
                id="joiningDate"
                name="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={handleChange}
                error={errors.joiningDate}
                required
                icon={<Calendar className="w-4 h-4 text-slate-400" />}
              />
              <FormField
                label="Department"
                id="department"
                name="department"
                type="select"
                value={formData.department}
                onChange={handleChange}
                options={departments}
                error={errors.department}
                required
              />
              <FormField
                label="Position"
                id="position"
                name="position"
                type="select"
                value={formData.position}
                onChange={handleChange}
                options={positions}
                error={errors.position}
                required
              />
              <FormField
                label="Status"
                id="status"
                name="status"
                type="select"
                value={formData.status}
                onChange={handleChange}
                options={["Active", "Inactive", "On Leave", "Terminated"]}
                error={errors.status}
              />
            </div>
          </Card>

          {/* 3. Account & Security */}
          <Card className="overflow-hidden border-0 shadow-md ring-1 ring-slate-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center">
              <div className="bg-amber-100 p-2 rounded-lg mr-3">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Account & Security</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="System Role"
                id="role"
                name="role"
                type="select"
                value={formData.role}
                onChange={handleChange}
                options={roles}
                error={errors.role}
                required
                helperText="Determines access permissions within the system."
              />
              <FormField
                label={isEditMode ? "New Password" : "Initial Password"}
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required={!isEditMode}
                placeholder={isEditMode ? "Leave blank to keep current" : "Min. 8 characters"}
                helperText={!isEditMode ? "Must be at least 8 characters long." : undefined}
              />
            </div>
          </Card>

          {/* 4. Financial Details (Optional) */}
          <Card className="overflow-hidden border-0 shadow-md ring-1 ring-slate-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center">
              <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Financial Details</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Bank Account Number"
                id="bankDetails"
                name="bankDetails"
                value={formData.bankDetails}
                onChange={handleChange}
                error={errors.bankDetails}
                placeholder="Account Number / IBAN"
              />
              <FormField
                label="National ID / SSN"
                id="nid"
                name="nid"
                value={formData.nid}
                onChange={handleChange}
                error={errors.nid}
                placeholder="National Identity Number"
              />
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default AddEmployeeForm;
