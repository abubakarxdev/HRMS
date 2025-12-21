import React, { useState, useMemo } from "react";
import { Eye, Edit, Trash2, Search, Filter, Plus, Users, UserCheck, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployees, useDeleteEmployee } from "@/hooks/useEmployees";
import { useNavigate } from "react-router-dom";
import { NAVIGATION_PATHS } from "@/constants";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { useOptionalOffice } from "@/contexts/OfficeContext";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";

const EmployeeDirectoryPage: React.FC = () => {
  const { user } = useAuth();
  const officeContext = useOptionalOffice();
  const currentOfficeId = officeContext?.currentOffice?.id;
  
  const canManageEmployees = user?.role === "ADMIN" || user?.role === "HR";
  
  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch ALL employees for filter dropdown options (Role/Department)
  // This matches AttendanceLogPage pattern of loading all employees for selector
  const { data: allEmployeesData = [] } = useEmployees(canManageEmployees ? currentOfficeId : undefined);
  
  // Handle case where allEmployeesData might be wrapped (unlikely given logic, but safe cast)
  const allEmployees = Array.isArray(allEmployeesData) ? allEmployeesData : [];

  // Fetch PAGINATED employees for the table
  const { data: paginatedResponse, isLoading } = useEmployees(canManageEmployees ? currentOfficeId : undefined, {
    page,
    limit,
    search: searchTerm,
    role: roleFilter,
    department: deptFilter,
    status: statusFilter
  });

  const employees = paginatedResponse?.data || [];
  const meta = paginatedResponse?.meta;

  const deleteMutation = useDeleteEmployee();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();

  // Stats Calculation - Should ideally come from backend aggregation, 
  // but using "allEmployees" allows for accurate total stats client-side for now
  const totalEmployees = allEmployees.length;
  const activeEmployees = allEmployees.filter(e => e.status === 'Active').length;
  const uniqueDepartmentsSet = new Set(allEmployees.map(e => {
        const activeContract = e.contracts?.[0];
        return activeContract?.department || (e as any).department;
  }).filter(Boolean));
  const departments = uniqueDepartmentsSet.size;

  // Derive unique values for dropdowns from ALL employees
  const uniqueDepartments = useMemo(() => {
    return Array.from(uniqueDepartmentsSet).sort();
  }, [allEmployees]);

  const uniqueRoles = useMemo(() => {
    const titles = new Set(allEmployees.map(e => {
        const activeContract = e.contracts?.[0];
        return activeContract?.position || (e as any).position;
    }).filter(Boolean));
    return Array.from(titles).sort();
  }, [allEmployees]);
  
  const handleAddEmployee = () => {
    if (user?.role === 'ADMIN') {
        navigate('/admin/employees/add');
    } else {
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

  // Safe access to pagination data
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.total || 0;

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
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                 <div className="flex items-center gap-2 text-slate-500 min-w-fit">
                    <Filter size={18} />
                    <span className="text-sm font-medium">Filter By:</span>
                 </div>
                 
                 <div className="flex flex-wrap items-center gap-2 w-full">
                    {/* Role Filter */}
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-600 font-medium cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                        <option value="all">All Roles</option>
                        {uniqueRoles.map(role => (
                            <option key={role as string} value={role as string}>{role as string}</option>
                        ))}
                    </select>

                    {/* Department Filter */}
                    <select
                        value={deptFilter}
                        onChange={(e) => {
                            setDeptFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-600 font-medium cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                        <option value="all">All Departments</option>
                        {uniqueDepartments.map(dept => (
                            <option key={dept as string} value={dept as string}>{dept as string}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-600 font-medium cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Terminated">Terminated</option>
                    </select>

                    {(roleFilter !== 'all' || deptFilter !== 'all' || statusFilter !== 'all') && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRoleFilter('all');
                                setDeptFilter('all');
                                setStatusFilter('all');
                                setPage(1);
                            }}
                            className="bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200 hover:border-indigo-200 rounded-xl font-semibold transition-all px-4 py-2 h-auto ml-auto md:ml-0"
                        >
                            Reset
                        </Button>
                    )}
                 </div>
            </div>
            
             <div className="relative w-full xl:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search by name, email, or ID..." 
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1); // Reset to first page on search
                    }}
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
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                            <p className="text-sm font-medium text-slate-600">Loading directory...</p>
                        </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                    <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                <Search size={32} />
                            </div>
                            <p className="font-medium text-slate-900">No employees found</p>
                            <p className="text-sm text-slate-500">Try adjusting your filters or search query.</p>
                            {(roleFilter !== 'all' || deptFilter !== 'all' || statusFilter !== 'all') && (
                                <button 
                                    onClick={() => {
                                        setRoleFilter('all');
                                        setDeptFilter('all');
                                        setStatusFilter('all');
                                    }}
                                    className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    </td>
                  </tr>
                ) : (
                    employees.map((employee) => {
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
          
          {/* Pagination */}
          <div className="bg-slate-50/50 border-t border-slate-100">
              <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  limit={limit}
                  onPageChange={(p) => setPage(p)}
              />
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

export default EmployeeDirectoryPage;
