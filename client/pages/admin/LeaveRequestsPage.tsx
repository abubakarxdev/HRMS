import React, { useState } from 'react';
import { useAllLeaveRequests, useUpdateLeaveStatus } from '../../hooks/useLeaves';
import { useOptionalOffice } from '../../context/OfficeContext';
import Button from '../../components/ui/Button';
import LeaveDetailsModal from '../../components/leaves/LeaveDetailsModal';
import dayjs from 'dayjs';
import { Eye, CheckCircle, XCircle, Clock, Filter, Search } from 'lucide-react';
import { FiUsers } from 'react-icons/fi';

const LeaveRequestsPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const officeContext = useOptionalOffice();
    const currentOfficeId = officeContext?.currentOfficeId;
    const { data: requestsData, isLoading } = useAllLeaveRequests(page, 100, statusFilter === 'all' ? undefined : statusFilter, undefined, currentOfficeId); // Fetch more for client-side search or implement server-side search later
    const updateStatusMutation = useUpdateLeaveStatus();

    const handleViewDetails = (request: any) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const handleApprove = async (id: string, comment: string) => {
        await updateStatusMutation.mutateAsync({ id, status: 'Approved', approverComments: comment });
        setIsModalOpen(false);
    };

    const handleReject = async (id: string, comment: string) => {
        await updateStatusMutation.mutateAsync({ id, status: 'Rejected', approverComments: comment });
        setIsModalOpen(false);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    // Calculate quick stats
    const pendingCount = requestsData?.data?.filter(r => r.status?.toUpperCase() === 'PENDING').length || 0;
    const approvedCount = requestsData?.data?.filter(r => r.status?.toUpperCase() === 'APPROVED').length || 0;

    // Client-side search filtering
    const filteredRequests = requestsData?.data?.filter(request => {
        if (!searchQuery) return true;
        const fullName = `${request.employee?.firstName || ''} ${request.employee?.lastName || ''}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase()) || 
               request.employee?.employeeIdNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    }) || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
             {/* Glassmorphism Header */}
             <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                 <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>

                 <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                         <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                                <FiUsers className="w-6 h-6 text-white" />
                             </div>
                             <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
                        </div>
                        <p className="text-indigo-100 max-w-lg text-lg">
                            Review and manage employee leave applications.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[140px]">
                            <div className="flex items-center gap-2 text-amber-300 mb-1">
                                <Clock size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{pendingCount}</p>
                        </div>
                         <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[140px]">
                            <div className="flex items-center gap-2 text-emerald-300 mb-1">
                                <CheckCircle size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Approved</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{approvedCount}</p>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 w-full md:w-auto">
                     <Filter size={18} />
                     <span className="text-sm font-medium">Filter by Status:</span>
                     <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 bg-slate-50 min-w-[150px]"
                    >
                        <option value="all">All Requests</option>
                        <option value="Pending">Pending Only</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
                
                 {/* Search Input */}
                 <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search employee..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                 </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider pl-8">Employee</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider pr-8">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                                     <div className="flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                                        <p className="text-sm font-medium text-slate-600">Loading requests...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                            <Search size={32} />
                                        </div>
                                        <p className="font-medium text-slate-900">No requests found</p>
                                        <p className="text-sm text-slate-500">Try adjusting your filters or search.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((request) => (
                                <tr key={request.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => handleViewDetails(request)}>
                                    <td className="px-6 py-4 whitespace-nowrap pl-8">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm">
                                                {request.employee?.firstName?.[0]}{request.employee?.lastName?.[0]}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {request.employee?.firstName} {request.employee?.lastName}
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium">{request.employee?.employeeIdNumber || 'ID: --'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                            {request.leaveType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900 font-medium">{dayjs(request.startDate).format('MMM D')} - {dayjs(request.endDate).format('MMM D, YYYY')}</div>
                                        <div className="text-xs text-slate-500">
                                            {dayjs(request.endDate).diff(dayjs(request.startDate), 'days') + 1} Days
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <p className="text-sm text-slate-600 truncate" title={request.reason}>
                                            {request.reason}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm ${getStatusColor(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right pr-8">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetails(request);
                                            }}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-xs font-bold shadow-sm shadow-indigo-200"
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {requestsData?.meta && requestsData.meta.totalPages > 1 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-sm text-slate-500">
                        Showing page <span className="font-bold text-slate-900">{page}</span> of {requestsData.meta.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            disabled={page === 1} 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="bg-white"
                        >
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            disabled={page === requestsData.meta.totalPages} 
                            onClick={() => setPage(p => Math.min(requestsData.meta.totalPages, p + 1))}
                            className="bg-white"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            <LeaveDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                request={selectedRequest}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </div>
    );
};

export default LeaveRequestsPage;
