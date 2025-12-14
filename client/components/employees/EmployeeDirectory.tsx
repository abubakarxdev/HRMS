import React, { useState } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useAuth } from "../../contexts/AuthContext";
import { useEmployees, useDeleteEmployee } from "../../hooks/useEmployees";
import { useNavigate } from "react-router-dom";
import { NAVIGATION_PATHS } from "@/constants";
import { toast } from "sonner";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import FourSquare from "../ui/FourSquare";

import { useOffice } from "../../context/OfficeContext";

import { useOptionalOffice } from "../../context/OfficeContext";

const EmployeeDirectory: React.FC = () => {
  const { user } = useAuth();
  const officeContext = useOptionalOffice();
  const currentOfficeId = officeContext?.currentOffice?.id;
  
  const canManageEmployees = user?.role === "ADMIN" || user?.role === "HR";
  
  // Pass officeId only if user is admin/hr (or consistent with logic)
  // Actually, if I am a standard employee, do I view directory only for my office?
  // Let's assume standard employees view all or same office.
  // Ideally, context should key off user role.
  // But for now, let's use currentOffice?.id for everyone if it exists, or just for admins.
  // Admin dashboard sets the office context. Main layout might not have OfficeProvider unless we add it to Main too.
  // Wait, AdminLayout provides OfficeProvider. Main doesn't.
  // If EmployeeDirectory is used in Main, useOffice will look for context.
  // If I use `useOffice` inside Main (standard user), it will throw "must be used within OfficeProvider".
  // I need to be careful. useOffice throws if no context.
  
  // Option A: Wrap Main in OfficeProvider too.
  // Option B: Make access optional or safe.
  
  // Let's create a safe version of useOffice or checks.
  // Or better, wrap App.tsx/Main in OfficeProvider?
  // Standard employees belong to an office.
  
  // For now, I will use a safe access pattern or try/catch? No hooks can't try/catch.
  // I'll assume currentOffice is undefined if context is missing? No, useOffice throws.
  
  // Let's modify usage.
  // If I am in AdminRoutes, I have context.
  // If I am in MainRoutes, I might not.
  
  // I will skip adding useOffice here blindly.
  // I should check if I am in Admin mode or pass props?
  // Or I just update Main to also provide OfficeContext (defaulting to user's assigned office).
  
  // Decision: Update Main to wrap in OfficeProvider? 
  // Maybe too much change. 
  // Let's assume this View is used in Admin Dashboard context mostly for "Managing".
  // Standard user directory view might not need filtering or backend handles it based on user token.
  
  // But the User asked: "ensure all... filtered by the selected office".
  // The Admin uses the Office Context.
  
  // Implementation:
  // I will check if useOffice is available. 
  // Actually, I can just use a helper: `useOfficeContextSafe`.
  
  // Or I can just Wrap `Main` in `OfficeProvider` too!
  // That seems most correct. Employees also have an "office" context (their own).
  
  // Let's update Main in App.tsx to use OfficeProvider first?
  // Yes, that allows re-use of components without fear.
  
  // But wait, OfficeProvider fetches *All Offices*. Standard employee might not be allowed to see /offices.
  // Good point.
  
  // So: Only Admins can switch offices.
  // Standard employees are fixed to their office.
  
  // I will implement a check in EmployeeDirectory:
  // We can't conditional hook.
  
  // Quick fix:
  // In `App.tsx`, for `AdminRoutes`, we clearly have `OfficeProvider`.
  // `EmployeeDirectory` is used in `AdminRoutes`.
  // It is ALSO used in `Main`.
  
  // I will create `AdminEmployeeDirectory` wrapper? 
  // Or just make `EmployeeDirectory` accept `officeId` as a prop!
  // And `AdminRoutes` passes the prop.
  // Use `useEmployees(officeId)` in the component.
  
  // Refactor `EmployeeDirectory` to take `officeId` prop?
  // `useEmployees` hook call is inside.
  
  // Let's add an optional prop `officeId` to `EmployeeDirectory`.
  // In `AdminRoutes`, we use the wrapper component `EmployeeDirectoryWrapper` (or similar) or just render `<EmployeeDirectory officeId={currentOffice.id} />`.
  
  // But `EmployeeDirectory` is a page/component.
  // Let's modify it to accept props.
  
  // Pass officeId if available (Admin Context)
  const { data: employees = [], isLoading } = useEmployees(canManageEmployees ? currentOfficeId : undefined);

  const deleteMutation = useDeleteEmployee();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();

  const filteredEmployees = employees.filter(
    (employee) => {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      return fullName.includes(search) || 
             employee.workEmail.toLowerCase().includes(search) ||
             employee.employeeIdNumber.toLowerCase().includes(search);
    }
  );

  const handleAddEmployee = () => {
    if (user?.role === 'ADMIN' || user?.role === 'HR') {
        navigate('/admin/employees/add');
    } else {
        navigate(`${NAVIGATION_PATHS.EMPLOYEES}/add`);
    }
  };

  const handleEditEmployee = (employeeId: string) => {
    navigate(`${NAVIGATION_PATHS.EMPLOYEES}/edit/${employeeId}`);
  };

  const handleDeleteClick = (employee: { id: string; name: string }) => {
    setEmployeeToDelete(employee);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(employeeToDelete.id);
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      // Error handled by mutation
    }
  };



  return (
    <>
      <Card
        title="Employee Directory"
        actions={
          <>
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {canManageEmployees && (
              <Button
                onClick={handleAddEmployee}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Add Employee
              </Button>
            )}
          </>
        }
      >
        <div className="overflow-x-auto rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12"
                  >
                    <div className="flex flex-col items-center justify-center text-slate-500 animate-pulse">
                        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                        <span className="text-sm font-medium">Loading employees...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const fullName = `${employee.firstName} ${employee.lastName}`;
                  const initials = `${employee.firstName[0]}${employee.lastName[0]}`;
                  
                  return (
                    <tr
                      key={employee.id}
                      className="hover:bg-slate-50 transition duration-100"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={
                                employee.avatarUrl ||
                                `https://placehold.co/100x100/4F46E5/FFFFFF?text=${initials}`
                              }
                              alt={fullName}
                              onError={(e) =>
                                (e.currentTarget.src = `https://placehold.co/100x100/4F46E5/FFFFFF?text=${initials}`)
                              }
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">
                              {fullName}
                            </div>
                            <div className="text-sm text-slate-500">
                              {employee.workEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                        {employee.employeeIdNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                        {employee.workEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            employee.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            onClick={() => navigate(`${NAVIGATION_PATHS.EMPLOYEES}/${employee.id}`)}
                            className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-full hover:bg-indigo-50 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManageEmployees && (
                            <>
                              <button
                                onClick={() => handleEditEmployee(employee.id)}
                                className="text-slate-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                                title="Edit Employee"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick({ id: employee.id, name: fullName })}
                                className="text-slate-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete Employee"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {!isLoading && filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    No employees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${employeeToDelete?.name}? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};

export default EmployeeDirectory;
