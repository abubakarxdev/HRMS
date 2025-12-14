import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    Search, 
    Plus, 
    Edit2, 
    Trash2, 
    Building2,
    ShieldCheck,
    Eye
} from "lucide-react";
import { apiClient as api } from "../../api/client";
import { toast } from "sonner";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import FormField from "../../components/ui/FormField";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import { Role } from "../../types";

// Types
interface AdminUser {
    id: string;
    email: string;
    role: Role;
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        legalEntity: {
            id: string;
            name: string;
        } | null;
    } | null;
}

interface LegalEntity {
    id: string;
    name: string;
}

const GlobalAdminsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [viewUser, setViewUser] = useState<AdminUser | null>(null);

    // Fetch Users
    const { data: users = [], isLoading } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const response = await api.get("/users");
            return response.data as AdminUser[];
        },
    });

    // Fetch Tenants for Dropdown
    const { data: tenants = [] } = useQuery({
        queryKey: ["tenants"],
        queryFn: async () => {
            const response = await api.get("/organizations");
            return response.data as LegalEntity[];
        },
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => api.post("/users", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setIsAddModalOpen(false);
            toast.success("Admin created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create admin");
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/users/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setIsAddModalOpen(false);
            setEditingUser(null);
            toast.success("Admin updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update admin");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setIsDeleteModalOpen(false);
            toast.success("Admin deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete admin");
        }
    });

    // Handlers
    const handleAdd = () => {
        setEditingUser(null);
        setIsAddModalOpen(true);
    };

    const handleEdit = (user: AdminUser) => {
        setEditingUser(user);
        setIsAddModalOpen(true);
    };

    const handleView = (user: AdminUser) => {
        setViewUser(user);
    };

    const handleDeleteClick = (user: AdminUser) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (selectedUser) {
            deleteMutation.mutate(selectedUser.id);
        }
    };

    const filteredUsers = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.employee?.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.employee?.lastName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Global Admins</h1>
                    <p className="text-slate-500 mt-1">Manage platform access and company administrators.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold" />
                        <input 
                            type="text"
                            placeholder="Search admins..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                        />
                    </div>
                    <Button onClick={handleAdd} className="w-full sm:w-auto shadow-md shadow-indigo-100">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Admin
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-sm ring-1 ring-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="py-4 px-6 font-semibold text-slate-600">User</th>
                                <th className="py-4 px-6 font-semibold text-slate-600 hidden md:table-cell">Role</th>
                                <th className="py-4 px-6 font-semibold text-slate-600 hidden md:table-cell">Company</th>
                                <th className="py-4 px-6 font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={4} className="py-8 text-center text-slate-500">Loading admins...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="py-8 text-center text-slate-500">No admins found matching your search.</td></tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-slate-50/80 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm uppercase ring-2 ring-white shadow-sm">
                                                    {user.employee?.firstName?.[0] || '?'}{user.employee?.lastName?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : 'No Profile'}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                                                    <span className="md:hidden inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 hidden md:table-cell">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                user.role === Role.SUPER_ADMIN 
                                                    ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                                    : 'bg-blue-100 text-blue-700 border-blue-200'
                                            }`}>
                                                {user.role === Role.SUPER_ADMIN ? <ShieldCheck className="w-3.5 h-3.5 mr-1" /> : <Building2 className="w-3.5 h-3.5 mr-1" />}
                                                {user.role === Role.SUPER_ADMIN ? 'Platform Owner' : 'Company Admin'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 hidden md:table-cell">
                                            {user.employee?.legalEntity ? (
                                                <span className="flex items-center text-slate-700 font-medium bg-slate-100 px-3 py-1 rounded-md w-fit">
                                                    <Building2 className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                                    {user.employee.legalEntity.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic font-medium">Global Access</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2 transition-opacity">
                                                 <button 
                                                    onClick={() => handleView(user)}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(user)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Helper Modal Component for Add/Edit */}
            {isAddModalOpen && (
                <UserModal 
                    isOpen={isAddModalOpen} 
                    onClose={() => setIsAddModalOpen(false)}
                    onSubmit={(data) => {
                        if (editingUser) {
                            updateMutation.mutate({ id: editingUser.id, data });
                        } else {
                            createMutation.mutate(data);
                        }
                    }}
                    initialData={editingUser}
                    tenants={tenants}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            )}

            {/* View Modal */}
            {viewUser && (
                <ViewUserModal 
                    isOpen={!!viewUser}
                    onClose={() => setViewUser(null)}
                    user={viewUser}
                />
            )}

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Admin User"
                message={`Are you sure you want to delete ${selectedUser?.employee?.firstName || 'this user'}? This action cannot be undone.`}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

// Sub-component for User Form
const UserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData: AdminUser | null;
    tenants: LegalEntity[];
    isLoading: boolean;
}> = ({ isOpen, onClose, onSubmit, initialData, tenants, isLoading }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        firstName: initialData?.employee?.firstName || "",
        lastName: initialData?.employee?.lastName || "",
        email: initialData?.email || "",
        password: "", // Keep empty for edit implies no change
        role: initialData?.role || Role.ADMIN,
        legalEntityId: initialData?.employee?.legalEntity?.id || ""
    });

    const isCompanyAdmin = formData.role === Role.ADMIN;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">
                        {initialData ? "Edit Admin" : "Add New Admin"}
                    </h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField 
                            id="firstName"
                            label="First Name"
                            value={formData.firstName}
                            onChange={e => setFormData({...formData, firstName: e.target.value})}
                            placeholder="John"
                        />
                        <FormField 
                            id="lastName"
                            label="Last Name"
                            value={formData.lastName}
                            onChange={e => setFormData({...formData, lastName: e.target.value})}
                            placeholder="Doe"
                        />
                    </div>
                    
                    <FormField 
                        id="email"
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        placeholder="admin@company.com"
                        disabled={!!initialData}
                    />

                    {!initialData && (
                        <FormField 
                            id="password"
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            placeholder="••••••••"
                        />
                    )}
                     {initialData && (
                        <FormField 
                            id="newPassword"
                            label="New Password (Optional)"
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            placeholder="Leave blank to keep current"
                        />
                    )}

                    <div>
                        <label htmlFor="role" className="text-sm font-medium text-slate-700 mb-1 flex items-center">Role</label>
                        <select 
                            id="role"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value as Role})}
                        >
                            <option value={Role.ADMIN}>Company Admin</option>
                            <option value={Role.SUPER_ADMIN}>Super Admin (Platform Owner)</option>
                        </select>
                    </div>

                    {isCompanyAdmin && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Company</label>
                            <select 
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={formData.legalEntityId}
                                onChange={e => setFormData({...formData, legalEntityId: e.target.value})}
                            >
                                <option value="">Select Company...</option>
                                {tenants.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="p-6 bg-slate-50 rounded-b-lg flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button 
                        onClick={() => onSubmit(formData)} 
                        isLoading={isLoading}
                        disabled={isLoading || !formData.email || (!initialData && !formData.password) || (isCompanyAdmin && !formData.legalEntityId)}
                    >
                        {initialData ? "Save Changes" : "Create Admin"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Sub-component for View User Modal
const ViewUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: AdminUser;
}> = ({ isOpen, onClose, user }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-white hover:bg-white/20 p-1 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="absolute -bottom-10 left-8">
                         <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg">
                            <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl uppercase">
                                {user.employee?.firstName?.[0] || '?'}{user.employee?.lastName?.[0] || '?'}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="pt-14 px-8 pb-8">
                    <h2 className="text-2xl font-bold text-slate-800">
                        {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : 'No Profile'}
                    </h2>
                    <p className="text-slate-500 mb-6">{user.email}</p>

                    <div className="space-y-4">
                        <div className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="p-2 bg-indigo-100 rounded-lg mr-4 text-indigo-600">
                                {user.role === Role.SUPER_ADMIN ? <ShieldCheck className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Role</p>
                                <p className="text-sm font-medium text-slate-800">
                                    {user.role === Role.SUPER_ADMIN ? 'Platform Owner (Super Admin)' : 'Company Admin'}
                                </p>
                            </div>
                        </div>

                         <div className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="p-2 bg-emerald-100 rounded-lg mr-4 text-emerald-600">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Assigned Company</p>
                                <p className="text-sm font-medium text-slate-800">
                                    {user.employee?.legalEntity?.name || "Global Platform Access"}
                                </p>
                            </div>
                        </div>

                         <div className="grid grid-cols-2 gap-4 mt-6">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Employee ID</p>
                                <p className="text-sm text-slate-700 font-medium">Coming Soon</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Status</p>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalAdminsPage;
