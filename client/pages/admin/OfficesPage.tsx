import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Search, Trash2, Edit2, Clock } from "lucide-react";
import { toast } from "sonner";
import { apiClient as api } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import FormField from "../../components/ui/FormField";

interface Office {
  id: string;
  name: string;
  address?: string;
  timezone: string;
  _count?: {
      employees: number;
  }
}

const OfficesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);

  // Fetch Offices
  const { data: offices = [], isLoading } = useQuery({
    queryKey: ["offices"],
    queryFn: async () => {
      const response = await api.get("/offices");
      return response.data as Office[];
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Office>) => {
      await api.post("/offices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices"] });
      toast.success("Office created successfully");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to create office");
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Office>) => {
        if (!editingOffice) return;
        await api.put(`/offices/${editingOffice.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices"] });
      toast.success("Office updated successfully");
      setIsModalOpen(false);
      setEditingOffice(null);
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to update office");
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/offices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices"] });
      toast.success("Office deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete office");
    }
  });

  const handleDelete = (id: string) => {
      if (confirm("Are you sure? This action cannot be undone.")) {
          deleteMutation.mutate(id);
      }
  };

  const filteredOffices = offices.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Offices</h1>
          <p className="text-slate-500">Manage your company's office locations.</p>
        </div>
        <Button onClick={() => { setEditingOffice(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Office
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
            type="text" 
            placeholder="Search offices..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffices.map((office) => (
            <Card key={office.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 rounded-lg">
                        <MapPin className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex space-x-2">
                         <button 
                            onClick={() => { setEditingOffice(office); setIsModalOpen(true); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                             onClick={() => handleDelete(office.id)}
                             className="p-1 hover:bg-red-50 rounded text-slate-500 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{office.name}</h3>
                {office.address && (
                     <p className="text-slate-500 text-sm mb-4 line-clamp-2">{office.address}</p>
                )}
                
                <div className="flex items-center text-sm text-slate-500 mb-4 bg-slate-50 p-2 rounded">
                    <Clock className="w-4 h-4 mr-2" />
                    {office.timezone}
                </div>
                
                <div className="border-t border-slate-100 pt-4 flex justify-between text-sm">
                    <span className="text-slate-500">Active Employees</span>
                    <span className="font-bold text-slate-700">{office._count?.employees || 0}</span>
                </div>
            </Card>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
          <OfficeModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSubmit={(data) => {
                if (editingOffice) {
                    updateMutation.mutate(data);
                } else {
                    createMutation.mutate(data);
                }
            }}
            initialData={editingOffice || undefined}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
      )}
    </div>
  );
};

// Simple internal modal component
const OfficeModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: any) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        address: initialData?.address || "",
        timezone: initialData?.timezone || "Asia/Karachi",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">{initialData ? "Edit Office" : "New Office"}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField 
                        id="name"
                        label="Office Name" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />
                    <FormField 
                        id="address"
                        label="Address" 
                        value={formData.address} 
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                     <FormField 
                        id="timezone"
                        label="Timezone" 
                        value={formData.timezone} 
                        onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                        placeholder="e.g. Asia/Karachi"
                        required
                    />
                    <div className="flex justify-end space-x-3 mt-6">
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Save</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OfficesPage;
