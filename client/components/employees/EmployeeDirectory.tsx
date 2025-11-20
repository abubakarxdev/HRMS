import React, { useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useAppContext } from "../../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { NAVIGATION_PATHS } from "@/constants";

const EmployeeDirectory: React.FC = () => {
  const { employees, loading, user } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
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

  const canAddEmployee = user?.role === "ADMIN_HR";

  return (
    <Card
      title="Employee Directory"
      actions={
        <>
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {canAddEmployee && (
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        navigate(`${NAVIGATION_PATHS.EMPLOYEES}/${employee.id}`)
                      }
                    >
                      View Profile
                    </Button>
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
  );
};

export default EmployeeDirectory;
