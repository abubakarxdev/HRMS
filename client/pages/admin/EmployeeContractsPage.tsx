import React, { useState } from "react";
import { 
    Briefcase, Plus, Search, Filter, Calendar, 
    CheckCircle2, AlertTriangle, Clock, TrendingUp,
    Eye, Trash2, RefreshCw
} from "lucide-react";
import { useOptionalOffice } from "../../context/OfficeContext";
import { useContracts, EmploymentContract, useDeleteContract } from "../../hooks/useContracts";
import ContractModal from "../../components/contracts/ContractModal";
import ContractHistoryModal from "../../components/contracts/ContractHistoryModal";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";

const EmployeeContractsPage: React.FC = () => {
    const officeContext = useOptionalOffice();
    const currentOfficeId = officeContext?.currentOfficeId;
    
    // Fetch Contracts
    const { data: contracts = [], isLoading } = useContracts(currentOfficeId);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ACTIVE"); // ALL, ACTIVE, EXPIRED, PROBATION, EXPIRING_SOON
    const [typeFilter, setTypeFilter] = useState("ALL"); // ALL, FULL_TIME, PART_TIME, etc.
    
    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<EmploymentContract | null>(null);
    const [renewalData, setRenewalData] = useState<Partial<EmploymentContract> | null>(null);
    const [contractToDelete, setContractToDelete] = useState<EmploymentContract | null>(null);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyEmployee, setHistoryEmployee] = useState<{id: string, name: string} | null>(null);
    
    const deleteMutation = useDeleteContract();

    // Derived State: Filtering
    const filteredContracts = contracts.filter(contract => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            contract.employee?.firstName.toLowerCase().includes(searchLower) ||
            contract.employee?.lastName.toLowerCase().includes(searchLower) ||
            contract.employee?.employeeIdNumber?.toLowerCase().includes(searchLower) ||
            contract.position.toLowerCase().includes(searchLower);
            
        let matchesStatus = true;
        if (statusFilter === "ACTIVE") matchesStatus = contract.isActive;
        if (statusFilter === "EXPIRED") matchesStatus = !contract.isActive;
        if (statusFilter === "PROBATION") matchesStatus = contract.type === "PROBATION" && contract.isActive;
        if (statusFilter === "EXPIRING_SOON") {
             if (!contract.endDate || !contract.isActive) matchesStatus = false;
             else {
                 const end = new Date(contract.endDate);
                 const now = new Date();
                 const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                 matchesStatus = diffDays > 0 && diffDays <= 30;
             }
        }

        let matchesType = true;
        if (typeFilter !== "ALL") {
             matchesType = contract.type === typeFilter;
        }

        return matchesSearch && matchesStatus && matchesType;
    });

    // Deduplicate: Group by employee, pick best contract (Active > ExpiryDate descending)
    const uniqueContractsMap = new Map<string, EmploymentContract>();
    
    filteredContracts.forEach(contract => {
        const employeeId = contract.employeeId;
        const existing = uniqueContractsMap.get(employeeId);
        
        if (!existing) {
            uniqueContractsMap.set(employeeId, contract);
        } else {
            // Priority: Active > Newer Start Date
            if (contract.isActive && !existing.isActive) {
                 uniqueContractsMap.set(employeeId, contract);
            } else if (contract.isActive === existing.isActive) {
                 if (new Date(contract.startDate) > new Date(existing.startDate)) {
                     uniqueContractsMap.set(employeeId, contract);
                 }
            }
        }
    });

    const displayContracts = Array.from(uniqueContractsMap.values())
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)); // Active first

    // Stats Calculation
    const activeCount = contracts.filter(c => c.isActive).length;
    const probationCount = contracts.filter(c => c.isActive && c.type === "PROBATION").length;
    const expiringSoonCount = contracts.filter(c => {
        if (!c.endDate || !c.isActive) return false;
        const end = new Date(c.endDate);
        const now = new Date();
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 30; 
    }).length;

    const handleCreate = () => {
        setEditingContract(null);
        setRenewalData(null);
        setIsFormOpen(true);
    };

    const handleEdit = (contract: EmploymentContract) => {
        setEditingContract(contract);
        setRenewalData(null);
        setIsFormOpen(true);
    };

    const handleRenew = (contract: EmploymentContract) => {
        setEditingContract(null);
        setRenewalData(contract); // Pass current contract as template
        setIsFormOpen(true);
    };

    const handleDelete = (contract: EmploymentContract) => {
        setContractToDelete(contract);
    };

    const handleViewHistory = (contract: EmploymentContract) => {
        if (contract.employee) {
            setHistoryEmployee({
                id: contract.employeeId,
                name: `${contract.employee.firstName} ${contract.employee.lastName}`
            });
            setHistoryModalOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (contractToDelete) {
            await deleteMutation.mutateAsync(contractToDelete.id);
            setContractToDelete(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            
            {/* 1. Glassmorphism Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
                 {/* Decorative Blobs */}
                 <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
                 <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl"></div>

                 <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                                <Briefcase className="w-6 h-6 text-indigo-300" />
                             </div>
                             <h1 className="text-3xl font-bold tracking-tight text-white">Contract Management</h1>
                        </div>
                        <p className="text-slate-300 max-w-xl text-lg leading-relaxed">
                            Monitor employee tenures, manage renewals, and track contract statuses across your organization.
                        </p>
                    </div>

                    <button 
                        onClick={handleCreate}
                        className="group relative inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold font-sans hover:bg-indigo-50 transition-all shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>New Contract</span>
                    </button>
                 </div>

                 {/* Premium Stats Row */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 mt-8 border-t border-white/10">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                                <CheckCircle2 size={18} />
                            </div>
                            <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Active Contracts</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">{activeCount}</span>
                            <span className="text-sm text-emerald-400 flex items-center gap-1">
                                <TrendingUp size={14} /> Stable
                            </span>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
                                <Clock size={18} />
                            </div>
                            <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Probation</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">{probationCount}</span>
                            <span className="text-sm text-slate-400">employees under review</span>
                        </div>
                    </div>

                     <div 
                        className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => setStatusFilter("EXPIRING_SOON")}
                     >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300">
                                <AlertTriangle size={18} />
                            </div>
                            <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Expiring Soon</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">{expiringSoonCount}</span>
                            <span className="text-sm text-rose-400">requires attention</span>
                        </div>
                    </div>
                 </div>
            </div>

            {/* 2. Controls & Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Filter className="text-slate-400 w-5 h-5 flex-shrink-0" />
                    
                    {/* Status Filter Dropdown */}
                    <select 
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-50 text-slate-600 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-40"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                         <option value="ALL">All Statuses</option>
                         <option value="ACTIVE">Active</option>
                         <option value="EXPIRED">Expired</option>
                         <option value="PROBATION">Probation</option>
                         <option value="EXPIRING_SOON">Expiring Soon</option>
                    </select>

                    {/* Contract Type Filter Dropdown */}
                    <select 
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-50 text-slate-600 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-40"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                         <option value="ALL">All Contract Types</option>
                         <option value="FULL_TIME">Full Time</option>
                         <option value="PART_TIME">Part Time</option>
                         <option value="CONTRACTUAL">Contractual</option>
                         <option value="INTERN">Intern</option>
                    </select>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search employee, position..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* 3. Contracts Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role & Dept</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Salary</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-12 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredContracts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center text-slate-400">
                                            <Briefcase size={40} className="mb-4 text-slate-200" />
                                            <p className="font-medium text-slate-600">No contracts found</p>
                                            <p className="text-sm">Try adjusting filters or create a new contract.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayContracts.map((contract) => (
                                    <tr key={contract.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                    {contract.employee?.firstName?.[0]}{contract.employee?.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900">{contract.employee?.firstName} {contract.employee?.lastName}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{contract.employee?.employeeIdNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-800">{contract.position}</div>
                                            <div className="text-xs text-slate-500">{contract.department || "N/A"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                contract.type === 'FULL_TIME' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                contract.type === 'PROBATION' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-slate-100 text-slate-700 border-slate-200'
                                            }`}>
                                                {contract.type.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col text-xs text-slate-600">
                                                <span className="flex items-center gap-1.5"><Calendar size={12}/> {new Date(contract.startDate).toLocaleDateString()}</span>
                                                {contract.endDate && (
                                                    <span className={`flex items-center gap-1.5 mt-1 ${
                                                        !contract.isActive && new Date(contract.endDate) < new Date() 
                                                        ? "text-rose-500 font-medium" 
                                                        : "text-slate-400"
                                                    }`}>
                                                        to {new Date(contract.endDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-slate-700">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: contract.currency }).format(contract.salary)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <div className="flex items-center gap-2">
                                                {contract.isActive ? (
                                                    <>
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                        <span className="text-xs font-bold text-emerald-700">Active</span>
                                                    </>
                                                ) : new Date(contract.endDate || "") < new Date() && contract.endDate ? (
                                                     <>
                                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                                        <span className="text-xs font-bold text-rose-700">Expired</span>
                                                     </>
                                                ) : (
                                                    <>
                                                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                                        <span className="text-xs font-bold text-slate-500">Inactive</span>
                                                    </>
                                                )}
                                             </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button 
                                                    onClick={() => handleEdit(contract)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="View / Edit"
                                                >
                                                    <div className="flex items-center gap-1">
                                                       <Eye size={16} />
                                                    </div>
                                                </button>
                                                <button 
                                                    onClick={() => handleViewHistory(contract)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="View History"
                                                >
                                                    <Clock size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleRenew(contract)}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                    title="Renew Contract"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(contract)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <ContractModal 
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                initialData={editingContract}
                renewalData={renewalData}
            />

            {historyEmployee && (
                <ContractHistoryModal 
                    isOpen={historyModalOpen}
                    onClose={() => setHistoryModalOpen(false)}
                    employeeId={historyEmployee.id}
                    employeeName={historyEmployee.name}
                />
            )}

            <DeleteConfirmationModal 
                isOpen={!!contractToDelete}
                onClose={() => setContractToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Contract"
                message="Are you sure? This is a legal record and deleting it might affect payroll history."
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

export default EmployeeContractsPage;
