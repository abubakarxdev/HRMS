import React, { useEffect } from "react";
import { X, Calendar, Briefcase, DollarSign, Building } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../ui/Button";
import Card from "../ui/Card";
import FormField from "../ui/FormField";
import { useCreateContract, useUpdateContract, EmploymentContract } from "../../hooks/useContracts";
import { useEmployees } from "../../hooks/useEmployees";
import { useOptionalOffice } from "@/contexts/OfficeContext";
import { contractSchema, ContractFormValues } from "../../validations/contract.schema";

interface ContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: EmploymentContract | null;
    renewalData?: Partial<EmploymentContract> | null; // For renewing: pre-fills form but creates NEW contract
    preselectedEmployeeId?: string; // If opening from Employee Profile
}

// Consistent options matching AddEmployeeForm
const DEPARTMENTS = ["Technology", "Human Resources", "Sales", "Finance", "Marketing", "Operations", "Legal", "Product"];
const POSITIONS = ["Software Engineer", "Senior Software Engineer", "Product Manager", "HR Manager", "Sales Representative", "Accountant", "Director", "Designer", "Marketing Specialist"];
const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "AED", "SAR", "AUD", "CAD"];

const ContractModal: React.FC<ContractModalProps> = ({ 
    isOpen, 
    onClose, 
    initialData,
    renewalData,
    preselectedEmployeeId 
}) => {
    const officeContext = useOptionalOffice();
    const currentOfficeId = officeContext?.currentOfficeId;
    
    // Fetch employees for the dropdown if not preselected
    const { data: employees = [] } = useEmployees(currentOfficeId);
    
    const createContract = useCreateContract();
    const updateContract = useUpdateContract();
    
    const { 
        register, 
        control, 
        handleSubmit, 
        reset, 
        formState: { errors, isSubmitting: isFormSubmitting } 
    } = useForm<ContractFormValues>({
        resolver: zodResolver(contractSchema) as any,
        defaultValues: {
            employeeId: "",
            type: "FULL_TIME",
            position: "",
            department: "",
            startDate: new Date().toISOString().split("T")[0],
            endDate: "",
            salary: 0,
            currency: "USD",
            isActive: true
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    employeeId: initialData.employeeId,
                    type: initialData.type,
                    position: initialData.position,
                    department: initialData.department || "",
                    startDate: new Date(initialData.startDate).toISOString().split("T")[0],
                    endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split("T")[0] : "",
                    salary: Number(initialData.salary),
                    currency: initialData.currency,
                    isActive: initialData.isActive
                });
            } else if (renewalData) {
                // Renewal Mode: Pre-fill but treat as new
                reset({
                    employeeId: renewalData.employeeId || "",
                    type: renewalData.type || "FULL_TIME",
                    position: renewalData.position || "",
                    department: renewalData.department || "",
                    startDate: new Date().toISOString().split("T")[0], // Start today or whenever
                    endDate: "",
                    salary: Number(renewalData.salary) || 0,
                    currency: renewalData.currency || "USD",
                    isActive: true
                });
            } else {
                reset({
                    employeeId: preselectedEmployeeId || "",
                    type: "FULL_TIME",
                    position: "",
                    department: "",
                    startDate: new Date().toISOString().split("T")[0],
                    endDate: "",
                    salary: 0,
                    currency: "USD",
                    isActive: true
                });
            }
        }
    }, [initialData, preselectedEmployeeId, isOpen, reset]);

    const onSubmit = async (data: ContractFormValues) => {
        try {
            const payload = {
                ...data,
                endDate: data.endDate || null, // Handle empty string
            };

            if (initialData) {
                await updateContract.mutateAsync({ id: initialData.id, data: payload as any });
            } else {
                await createContract.mutateAsync(payload as any);
            }
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    if (!isOpen) return null;

    const isLoading = createContract.isPending || updateContract.isPending || isFormSubmitting;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4 flex justify-between items-center text-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Briefcase size={20} className="text-white/80" />
                        {initialData ? "Edit Contract" : "New Employment Contract"}
                    </h2>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    
                    {/* Employee Selection (Only if new and not preselected) */
                     /* If renewing, we likely want to lock employee or just show it, but for flexibility we can verify.
                        Actually if renewalData is present, employeeId is set. */
                    }
                    {!initialData && !preselectedEmployeeId && !renewalData && (
                        <Card className="border-slate-200 shadow-sm p-4 bg-slate-50">
                             <Controller
                                name="employeeId"
                                control={control}
                                render={({ field }) => (
                                    <FormField
                                        id="employeeId"
                                        label="Select Employee"
                                        type="select"
                                        {...field}
                                        error={errors.employeeId?.message}
                                        options={[
                                            { value: "", label: "Select an employee..." },
                                            ...employees.map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName} (${e.employeeIdNumber || 'No ID'})` }))
                                        ]}
                                        required
                                        placeholder="Choose an employee for this contract..."
                                    />
                                )}
                             />
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    id="type"
                                    label="Contract Type"
                                    type="select"
                                    {...field}
                                    error={errors.type?.message}
                                    options={[
                                        { value: "FULL_TIME", label: "Full Time" },
                                        { value: "PART_TIME", label: "Part Time" },
                                        { value: "CONTRACTUAL", label: "Contractual" },
                                        { value: "INTERN", label: "Intern" },
                                        { value: "PROBATION", label: "Probation" }
                                    ]}
                                    required
                                />
                            )}
                        />
                        

                        <div className="flex gap-4">
                             <div className="flex-1">
                                <Controller
                                    name="salary"
                                    control={control}
                                    render={({ field }) => (
                                        <FormField
                                            id="salary"
                                            label="Salary"
                                            type="number"
                                            {...field}
                                            error={errors.salary?.message}
                                            icon={<DollarSign size={16} className="text-slate-400" />}
                                            required
                                        />
                                    )}
                                />
                             </div>
                             <div className="w-24">
                                <Controller
                                    name="currency"
                                    control={control}
                                    render={({ field }) => (
                                        <FormField
                                            id="currency"
                                            label="Currency"
                                            type="select"
                                            {...field}
                                            error={errors.currency?.message}
                                            options={CURRENCIES.map(c => ({ value: c, label: c }))} 
                                            required
                                        />
                                    )}
                                />
                             </div>
                        </div>

                        <Controller
                            name="position"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    id="position"
                                    label="Job Position"
                                    type="select"
                                    {...field}
                                    error={errors.position?.message}
                                    options={[{ value: "", label: "Select Position..." }, ...POSITIONS.map(p => ({ value: p, label: p }))]}
                                    icon={<Briefcase size={16} className="text-slate-400" />}
                                    required
                                    placeholder="Select a position"
                                />
                            )}
                        />

                        <Controller
                            name="department"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    id="department"
                                    label="Department"
                                    type="select"
                                    {...field}
                                    error={errors.department?.message}
                                    options={[{ value: "", label: "Select Department..." }, ...DEPARTMENTS.map(d => ({ value: d, label: d }))]}
                                    icon={<Building size={16} className="text-slate-400" />}
                                    placeholder="Select a department"
                                />
                            )}
                        />

                        <Controller
                            name="startDate"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    id="startDate"
                                    label="Start Date"
                                    type="date"
                                    {...field}
                                    error={errors.startDate?.message}
                                    icon={<Calendar size={16} className="text-slate-400" />}
                                    required
                                />
                            )}
                        />

                        <Controller
                            name="endDate"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    id="endDate"
                                    label="End Date (Optional)"
                                    type="date"
                                    {...field}
                                    value={field.value || ""}
                                    error={errors.endDate?.message}
                                    icon={<Calendar size={16} className="text-slate-400" />}
                                    helperText="Leave blank for indefinite contracts."
                                />
                            )}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            isLoading={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                        >
                            {initialData ? "Update Contract" : "Create Contract"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContractModal;
