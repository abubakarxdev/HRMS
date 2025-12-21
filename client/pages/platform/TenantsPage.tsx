import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Search, Trash2, Edit2, Globe, Coins } from "lucide-react";
import { toast } from "sonner";
import { apiClient as api } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import FormField from "../../components/ui/FormField";

interface LegalEntity {
  id: string;
  name: string;
  countryCode: string;
  defaultCurrency: string;
  logoUrl?: string;
  _count?: {
      offices: number;
      employees: number;
  }
}

const TenantsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<LegalEntity | null>(null);

  // Fetch Tenants
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = await api.get("/organizations");
      return response.data as LegalEntity[];
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<LegalEntity>) => {
      await api.post("/organizations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant created successfully");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to create tenant");
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<LegalEntity>) => {
      await api.put(`/organizations/${editingEntity?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant updated successfully");
      setIsModalOpen(false);
      setEditingEntity(null);
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to update tenant");
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/organizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete tenant");
    }
  });

  const handleDelete = (id: string) => {
      if (confirm("Are you sure? This action cannot be undone.")) {
          deleteMutation.mutate(id);
      }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tenants</h1>
          <p className="text-slate-500">Manage legal entities and companies.</p>
        </div>
        <Button onClick={() => { setEditingEntity(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
            type="text" 
            placeholder="Search tenants..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 rounded-lg">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => { setEditingEntity(tenant); setIsModalOpen(true); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                             onClick={() => handleDelete(tenant.id)}
                             className="p-1 hover:bg-red-50 rounded text-slate-500 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{tenant.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
                    <div className="flex items-center">
                        <Globe className="w-3 h-3 mr-1" />
                        {tenant.countryCode}
                    </div>
                    <div className="flex items-center">
                        <Coins className="w-3 h-3 mr-1" />
                        {tenant.defaultCurrency}
                    </div>
                </div>
                
                <div className="border-t border-slate-100 pt-4 flex justify-between text-sm">
                    <div>
                        <span className="block font-bold text-slate-700">{tenant._count?.offices || 0}</span>
                        <span className="text-slate-500">Offices</span>
                    </div>
                    <div className="text-right">
                        <span className="block font-bold text-slate-700">{tenant._count?.employees || 0}</span>
                        <span className="text-slate-500">Employees</span>
                    </div>
                </div>
            </Card>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
          <TenantModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSubmit={(data) => {
                if (editingEntity) {
                    updateMutation.mutate(data);
                } else {
                    createMutation.mutate(data);
                }
            }}
            initialData={editingEntity || undefined}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
      )}
    </div>
  );
};

// Simple internal modal component
const TenantModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: any) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        countryCode: initialData?.countryCode || "US",
        defaultCurrency: initialData?.defaultCurrency || "USD",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">{initialData ? "Edit Tenant" : "New Tenant"}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField 
                        id="name"
                        label="Company Name" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField 
                            id="countryCode"
                            label="Country Code" 
                            value={formData.countryCode} 
                            onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                            placeholder="e.g. US"
                            required
                        />
                         <FormField 
                            id="defaultCurrency"
                            label="Currency" 
                            value={formData.defaultCurrency} 
                            onChange={(e) => setFormData({...formData, defaultCurrency: e.target.value})}
                            placeholder="e.g. USD"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Save</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TenantsPage;
