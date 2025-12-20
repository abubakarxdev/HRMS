import React from "react";
import { X, Calendar, DollarSign, Clock } from "lucide-react";
import { useEmployeeContracts } from "../../hooks/useContracts";

interface ContractHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string;
    employeeName: string;
}

const ContractHistoryModal: React.FC<ContractHistoryModalProps> = ({ 
    isOpen, 
    onClose, 
    employeeId,
    employeeName
}) => {
    const { data: contracts = [], isLoading } = useEmployeeContracts(employeeId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden transform transition-all scale-100 max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                           <Clock size={20} className="text-indigo-400" />
                           Contract History
                        </h2>
                        <p className="text-slate-400 text-sm mt-0.5">Timeline for {employeeName}</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-lg hover:bg-white/20">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-6">
                    {isLoading ? (
                         <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : contracts.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            No contract history found.
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pl-8 py-2">
                            {contracts.map((contract, index) => {
                                const isCurrent = contract.isActive;
                                const isExpired = !contract.isActive && contract.endDate && new Date(contract.endDate) < new Date();
                                
                                return (
                                    <div key={contract.id} className="relative group">
                                         {/* Timeline Node */}
                                         <div className={`absolute -left-[41px] top-0 h-5 w-5 rounded-full border-4 ${
                                             isCurrent ? "bg-white border-green-500" : 
                                             isExpired ? "bg-slate-100 border-slate-300" : 
                                             "bg-slate-100 border-indigo-300"
                                         }`}></div>
                                         
                                         <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                             <div className="flex justify-between items-start mb-2">
                                                 <div>
                                                     <h3 className="font-bold text-slate-800 text-lg">{contract.position}</h3>
                                                     <div className="text-sm text-slate-500 font-medium">{contract.department}</div>
                                                 </div>
                                                 <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                                     isCurrent ? "bg-green-100 text-green-700" :
                                                     isExpired ? "bg-rose-100 text-rose-700" :
                                                     "bg-slate-100 text-slate-600"
                                                 }`}>
                                                     {isCurrent ? "Current" : isExpired ? "Expired" : "Inactive"}
                                                 </div>
                                             </div>

                                             <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                                 <div>
                                                     <div className="text-slate-400 text-xs uppercase font-bold mb-1">Contract Type</div>
                                                     <div className="font-medium text-slate-700">{contract.type.replace("_", " ")}</div>
                                                 </div>
                                                 <div>
                                                     <div className="text-slate-400 text-xs uppercase font-bold mb-1">Duration</div>
                                                     <div className="flex items-center gap-1.5 text-slate-700 font-medium font-mono">
                                                         <Calendar size={14} className="text-slate-400" />
                                                         {new Date(contract.startDate).toLocaleDateString()}
                                                          <span className="text-slate-400">-</span> 
                                                         {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "Ongoing"}
                                                     </div>
                                                 </div>
                                                 <div>
                                                     <div className="text-slate-400 text-xs uppercase font-bold mb-1">Salary</div>
                                                     <div className="flex items-center gap-1 text-slate-700 font-medium font-mono">
                                                         <DollarSign size={14} className="text-slate-400" />
                                                         {new Intl.NumberFormat('en-US', { style: 'currency', currency: contract.currency }).format(contract.salary)}
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractHistoryModal;
