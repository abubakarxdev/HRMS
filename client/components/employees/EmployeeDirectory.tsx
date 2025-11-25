import React, { useState } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useAppContext } from "../../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { NAVIGATION_PATHS } from "@/constants";
import { toast } from "sonner";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
const EmployeeDirectory: React.FC = () => {
  const { employees, loading, user, deleteEmployee } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to handle adding a new employee
  const handleAddEmployee = () => {
    navigate(`${NAVIGATION_PATHS.EMPLOYEES}/add`);
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
    
    setIsDeleting(true);
    try {
      await deleteEmployee(employeeToDelete.id);
      toast.success(`Employee ${employeeToDelete.name} deleted successfully`);
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      toast.error("Failed to delete employee");
    } finally {
      setIsDeleting(false);
    }
  };

  const canManageEmployees = user?.role === "ADMIN_HR" || user?.role === "MANAGER";

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
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Department
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
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8 text-indigo-600 font-medium"
                  >
                    Loading employee data...
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
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
                              employee.avatar ||
                              `https://placehold.co/100x100/4F46E5/FFFFFF?text=${employee.name[0]}`
                            }
                            alt={employee.name}
                            onError={(e) =>
                              (e.currentTarget.src = `https://placehold.co/100x100/4F46E5/FFFFFF?text=${employee.name[0]}`)
                            }
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">
                            {employee.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {employee.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                      {employee.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                      {employee.department}
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
                          onClick={() => navigate(`${NAVIGATION_PATHS.EMPLOYEES}/${employee.employeeId}`)}
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
                              onClick={() => handleDeleteClick({ id: employee.id, name: employee.name })}
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
                ))
              )}
              {!loading && filteredEmployees.length === 0 && (
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
        isLoading={isDeleting}
      />
    </>
  );
};

export default EmployeeDirectory;
