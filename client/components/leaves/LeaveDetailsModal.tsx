import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Calendar, User, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '../ui/Button';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { useAllLeaveRequests, useEmployeeLeaveBalances } from '../../hooks/useLeaves';
import LeaveBalanceCard from './LeaveBalanceCard';
import { calculateWorkingDays } from '../../utils/dateUtils';

interface LeaveDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: any;
    onApprove?: (id: string, comment: string) => void;
    onReject?: (id: string, comment: string) => void;
}

const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({ isOpen, onClose, request, onApprove, onReject }) => {
    const [comment, setComment] = useState('');
    const { user } = useAuth();
    const isSelfRequest = user?.employeeId === request?.employeeId;

    // Fetch History and Balances only if open and request exists AND user is explicitly ADMIN or HR
    // This prevents "Unauthorized" errors for regular employees viewing their own requests
    // Explicitly define enablement condition
    const canFetchAdminData = !!(request?.employee?.id && (user?.role === 'ADMIN' || user?.role === 'HR'));
    
    console.log('LeaveDetailsModal: User Role:', user?.role, 'Can Fetch:', canFetchAdminData);

    const { data: historyData, isLoading: loadingHistory } = useAllLeaveRequests(
        1, 10, undefined, request?.employee?.id, undefined, 
        undefined, undefined, // startDate, endDate
        canFetchAdminData
    );
    
    // Note: useEmployeeLeaveBalances hook doesn't accept an 'enabled' option in its current definition in useLeaves.ts
    // We should probably update the hook to accept options, but for now, let's just use it 
    // effectively by passing undefined if not authorized, which might still trigger a call with undefined ID?
    // Let's verify useEmployeeLeaveBalances implementation.
    // Looking at the previous step, it uses useQuery(['employee-balances', id], () => service.get(id), { enabled: !!id })
    // So passing undefined ID disables it.
    
    const { data: balances, isLoading: loadingBalances } = useEmployeeLeaveBalances(
        canFetchAdminData ? request?.employee?.id : undefined
    );

    if (!request) return null;

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return <CheckCircle className="w-5 h-5 mr-2" />;
            case 'rejected': return <XCircle className="w-5 h-5 mr-2" />;
            default: return <Clock className="w-5 h-5 mr-2" />;
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" aria-hidden="true" />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className={`mx-auto w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto transform transition-all ${
                    canFetchAdminData && !isSelfRequest ? 'max-w-5xl' : 'max-w-xl'
                }`}>
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-20">
                        <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg ${
                                request.leaveType === 'Sick' ? 'bg-red-50 text-red-600' :
                                request.leaveType === 'Annual' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                             }`}>
                                {getStatusIcon(request.status)}
                             </div>
                             <div>
                                <Dialog.Title className="text-lg font-bold text-slate-800 leading-tight">Leave Details</Dialog.Title>
                                <p className="text-xs text-slate-500 font-medium">
                                    {request.employee?.firstName} {request.employee?.lastName}
                                </p>
                             </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className={`p-6 grid grid-cols-1 ${canFetchAdminData && !isSelfRequest ? 'lg:grid-cols-5' : ''} gap-8`}>
                        {/* MAIN CONTENT COLUMN */}
                        <div className={`${canFetchAdminData && !isSelfRequest ? 'lg:col-span-3' : ''} space-y-6`}>
                            
                            {/* Key Stats Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Type</span>
                                    <div className="font-bold text-slate-800 text-sm flex items-center">
                                         <div className={`w-2 h-2 rounded-full mr-2 ${
                                            request.leaveType === 'Sick' ? 'bg-red-500' : 
                                            request.leaveType === 'Annual' ? 'bg-blue-500' : 'bg-yellow-500'
                                        }`}></div>
                                        {request.leaveType}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Days</span>
                                    <div className="font-bold text-slate-800 text-sm flex items-center">
                                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                        {calculateWorkingDays(request.startDate, request.endDate)} {calculateWorkingDays(request.startDate, request.endDate) === 1 ? 'Day' : 'Days'}
                                    </div>
                                </div>
                            </div>

                            {/* Date Range Banner */}
                             <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg text-indigo-500 shadow-sm">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-indigo-900/60 block mb-0.5">Duration</span>
                                        <div className="text-sm font-bold text-indigo-900">
                                            {dayjs(request.startDate).format('MMM D')} 
                                            <span className="mx-2 text-indigo-300">→</span> 
                                            {dayjs(request.endDate).format('MMM D, YYYY')}
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(request.status)}`}>
                                    {request.status}
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">Reason</h4>
                                <div className="text-slate-600 bg-white p-4 rounded-xl border border-slate-200 text-sm leading-relaxed shadow-sm">
                                    "{request.reason}"
                                </div>
                            </div>

                            {/* Attachments (Compact) */}
                            {request.attachmentUrl && (
                                <a 
                                    href={request.attachmentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl transition-all group cursor-pointer"
                                >
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg mr-3 group-hover:bg-indigo-100 transition-colors">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="block font-semibold text-slate-700 text-sm group-hover:text-indigo-700">Attachment.pdf</span>
                                    </div>
                                    <span className="text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Download</span>
                                </a>
                            )}

                            {/* Admin Actions (Compact) */}
                            {request.status === 'Pending' && onApprove && onReject && !isSelfRequest && (
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mt-2">
                                    <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Review Request</h4>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm mb-3"
                                        rows={2}
                                        placeholder="Add optional comments..."
                                    />
                                    <div className="flex gap-3 justify-end">
                                        <Button 
                                            variant="danger" 
                                            size="sm"
                                            onClick={() => onReject(request.id, comment)}
                                            className="min-w-[100px]"
                                        >
                                            Reject
                                        </Button>
                                        <Button 
                                            size="sm"
                                            onClick={() => onApprove(request.id, comment)}
                                            className="bg-green-600 hover:bg-green-700 text-white border-transparent min-w-[100px]"
                                        >
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            )}

                             {/* Approver Comments */}
                             {request.status !== 'Pending' && request.approverComments && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">Approver Note</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-600 italic">
                                        "{request.approverComments}"
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT SIDEBAR: History & Balances (ADMIN/HR ONLY AND NOT SELF) */}
                        {canFetchAdminData && !isSelfRequest && (
                        <div className="lg:col-span-2 space-y-6 lg:border-l lg:border-slate-100 lg:pl-8 flex flex-col h-full">
                            
                            {/* Balances */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Balances</h4>
                                {loadingBalances ? (
                                    <div className="animate-pulse space-y-2">
                                        <div className="h-14 bg-slate-50 rounded-xl"></div>
                                        <div className="h-14 bg-slate-50 rounded-xl"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {balances?.map(balance => (
                                            <LeaveBalanceCard
                                                key={balance.id}
                                                type={balance.leaveType}
                                                total={balance.totalCredits}
                                                used={balance.usedCredits}
                                                compact={true}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Recent History */}
                            <div className="space-y-3 flex-1 flex flex-col min-h-0">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">History</h4>
                                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex-1 min-h-[150px]">
                                    {loadingHistory ? (
                                        <div className="p-6 text-center text-slate-400 text-xs">Loading...</div>
                                    ) : historyData?.data?.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 text-xs">No recent history.</div>
                                    ) : (
                                        <div className="max-h-[250px] overflow-y-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-100 text-slate-500 font-medium sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2">Type</th>
                                                        <th className="px-3 py-2">Date</th>
                                                        <th className="px-3 py-2 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {historyData?.data?.slice(0, 5).map(req => (
                                                        <tr key={req.id} className={req.id === request.id ? 'bg-indigo-50/50' : 'hover:bg-white transition-colors'}>
                                                            <td className="px-3 py-2 font-medium text-slate-700">{req.leaveType}</td>
                                                            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{dayjs(req.startDate).format('MMM D')}</td>
                                                            <td className="px-3 py-2 text-right">
                                                                <div className={`inline-block w-2 h-2 rounded-full ${
                                                                    req.status === 'Approved' ? 'bg-green-500' :
                                                                    req.status === 'Rejected' ? 'bg-red-500' :
                                                                    'bg-amber-500'
                                                                }`}></div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default LeaveDetailsModal;
