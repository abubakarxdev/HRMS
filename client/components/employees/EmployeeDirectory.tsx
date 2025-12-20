import React, { useState } from "react";
import { Eye, Edit, Trash2, Search, Filter, Plus, Users, UserCheck, Briefcase } from "lucide-react";
import Button from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { useEmployees, useDeleteEmployee } from "../../hooks/useEmployees";
import { useNavigate } from "react-router-dom";
import { NAVIGATION_PATHS } from "@/constants";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import { useOptionalOffice } from "../../context/OfficeContext";

const EmployeeDirectory: React.FC = () => {
  const { user } = useAuth();
  const officeContext = useOptionalOffice();
  const currentOfficeId = officeContext?.currentOffice?.id;
  
  const canManageEmployees = user?.role === "ADMIN" || user?.role === "HR";
  
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

  // Stats Calculation
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const departments = new Set(employees.map(e => e.department).filter(Boolean)).size;

  const handleAddEmployee = () => {
    if (user?.role === 'ADMIN') {
        navigate('/admin/employees/add');
    } else {
        // HR and others use the standard path (defined in Main routes)
        navigate(`${NAVIGATION_PATHS.EMPLOYEES}/add`);
    }
  };

  const handleEditEmployee = (employeeId: string) => {
    if (user?.role === 'ADMIN') {
        navigate(`/admin/employees/edit/${employeeId}`);
    } else {
        navigate(`${NAVIGATION_PATHS.EMPLOYEES}/edit/${employeeId}`);
    }
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Glassmorphism Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-400 opacity-20 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
                  </div>
                  <p className="text-indigo-100 max-w-lg text-lg">
                      View and manage your team members and organization structure.
                  </p>
            </div>

             {canManageEmployees && (
                <button 
                    onClick={handleAddEmployee}
                    className="bg-white text-indigo-700 hover:bg-indigo-50 border border-transparent shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95 font-bold px-6 py-3 rounded-xl flex items-center gap-2 group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    Add Employee
                </button>
             )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 mt-6 border-t border-white/10">
               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                   <div className="flex items-center gap-2 text-indigo-200 mb-1">
                       <Users size={16} />
                       <span className="text-xs font-bold uppercase tracking-wider">Total</span>
                   </div>
                   <p className="text-3xl font-bold text-white">{totalEmployees}</p>
               </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                   <div className="flex items-center gap-2 text-emerald-300 mb-1">
                       <UserCheck size={16} />
                       <span className="text-xs font-bold uppercase tracking-wider">Active</span>
                   </div>
                   <p className="text-3xl font-bold text-white">{activeEmployees}</p>
               </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                   <div className="flex items-center gap-2 text-amber-300 mb-1">
                       <Briefcase size={16} />
                       <span className="text-xs font-bold uppercase tracking-wider">Departments</span>
                   </div>
                   <p className="text-3xl font-bold text-white">{departments}</p>
               </div>
          </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 w-full md:w-auto">
                 <Filter size={18} />
                 <span className="text-sm font-medium">Filter Directory:</span>
                 {/* Placeholder for future filters */}
                 <span className="text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-600 font-medium">All Employees</span>
            </div>
            
             <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search by name, email, or ID..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
             </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                   <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider pl-8">Employee</th>
                   <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Work Email</th>
                   <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role & Dept</th>
                   <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                   <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                            <p className="text-sm font-medium text-slate-600">Loading directory...</p>
                        </div>
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                    <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                <Search size={32} />
                            </div>
                            <p className="font-medium text-slate-900">No employees found</p>
                            <p className="text-sm text-slate-500">Try adjusting your search query.</p>
                        </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => {
                    const fullName = `${employee.firstName} ${employee.lastName}`;
                    const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`;
                    const activeContract = employee.contracts?.[0]; // Assuming backend returns active contract
                    const position = activeContract?.position || (employee as any).position || 'Unassigned';
                    const department = activeContract?.department || (employee as any).department || 'Unassigned';

                    return (
                      <tr
                        key={employee.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap pl-8">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover border-2 border-slate-100 shadow-sm"
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
                              <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {fullName}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                {employee.employeeIdNumber}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5 md:hidden">
                                {employee.workEmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                             <div className="text-sm text-slate-600">{employee.workEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-sm font-medium text-slate-800">{position}</div>
                             <div className="text-xs text-slate-500 mt-0.5">{department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${
                              employee.status === "Active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {employee.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium pr-8">
                          <div className="flex justify-end items-center space-x-1">
                            <button
                              onClick={() => navigate(`${NAVIGATION_PATHS.EMPLOYEES}/${employee.id}`)}
                              className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-all"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canManageEmployees && (
                              <>
                                <button
                                  onClick={() => handleEditEmployee(employee.id)}
                                  className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-all"
                                  title="Edit Employee"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick({ id: employee.id, name: fullName })}
                                  className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
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
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${employeeToDelete?.name}? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default EmployeeDirectory;
