import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leavesService } from '../../api/services/leaves.service';
import { useEmployeeLeaveBalances, useAllLeaveRequests, useUpdateLeaveStatus, useLeaveRequestDetails } from '../../hooks/useLeaves';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiFileText, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiDownload, 
  FiUser, 
  FiBriefcase,
  FiAlertCircle
} from 'react-icons/fi';
import Button from '../../components/ui/Button';
import LeaveBalanceCard from '../../components/leaves/LeaveBalanceCard';
import { calculateWorkingDays } from '../../utils/dateUtils';

const LeaveRequestDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [comment, setComment] = useState('');

    const handleBack = () => {
        if (user?.role === 'ADMIN') {
            navigate('/admin/leaves/requests');
        } else {
            // HR or Employee navigating back
            navigate(-1);
        }
    };

    // Fetch Request Details
    const { data: request, isLoading: loadingRequest, isError } = useLeaveRequestDetails(id!);

    // Fetch Employee History & Balances (Enabled only when request data is available)
    const employeeId = request?.employee?.id; 
    
    const { data: historyData, isLoading: loadingHistory } = useAllLeaveRequests(
        1, 10, undefined, employeeId, undefined, 
        undefined, undefined, // startDate, endDate
        // Force enabled only if employeeId exists to avoid premature calls
        !!employeeId 
    );
    
    const { data: balances, isLoading: loadingBalances } = useEmployeeLeaveBalances(employeeId);

    // Mutations
    const updateStatusMutation = useUpdateLeaveStatus();
    
    // We wrap the mutation to handle the comment state clearing
    const handleStatusUpdate = (status: string) => {
        updateStatusMutation.mutate(
            { id: id!, status, approverComments: comment },
            {
                onSuccess: () => {
                    setComment('');
                    // query invalidation is handled inside the hook
                }
            }
        );
    };

    if (loadingRequest) {
        return (
             <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (isError || !request) {
        return (
             <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
                <h2 className="text-2xl font-bold text-slate-800">Request Not Found</h2>
                <Button variant="outline" onClick={handleBack}>
                    <FiArrowLeft className="w-4 h-4 mr-2" /> Back to Requests
                </Button>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return <FiCheckCircle className="w-5 h-5 mr-2" />;
            case 'rejected': return <FiXCircle className="w-5 h-5 mr-2" />;
            default: return <FiClock className="w-5 h-5 mr-2" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Hero Section - Glassmorphism */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                 <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>

                <div className="relative z-10 space-y-6">
                    {/* Header Row */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/20 text-white transition-all shadow-sm group"
                            title="Back"
                        >
                            <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Leave Request Details</h1>
                            <p className="text-indigo-100 mt-1 flex items-center gap-2 text-sm font-medium">
                                <FiCalendar size={14} />
                                Applied on {dayjs(request.createdAt).format('MMMM D, YYYY')}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-6 border-t border-white/10">
                        {/* Employee Info */}
                        <div className="flex-1">
                             <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-2xl font-bold text-white overflow-hidden">
                                    {request.employee?.avatarUrl ? (
                                        <img src={request.employee.avatarUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        request.employee?.firstName?.[0] || <FiUser />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">
                                        {request.employee?.firstName} {request.employee?.lastName}
                                    </h2>
                                    <div className="flex items-center gap-3 text-indigo-200 text-sm font-medium">
                                        <span className="flex items-center gap-1">
                                            <FiBriefcase size={12} />
                                            {request.employee?.employeeIdNumber || 'ID: --'}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                                        <span className="flex items-center gap-1">
                                            <FiUser size={12} />
                                            {request.employee?.workEmail}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[120px]">
                                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1">Leave Type</p>
                                <p className="text-xl font-bold text-white truncate">{request.leaveType}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[120px]">
                                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1">Duration</p>
                                <p className="text-xl font-bold text-white">
                                    {calculateWorkingDays(request.startDate, request.endDate)} {calculateWorkingDays(request.startDate, request.endDate) === 1 ? 'Day' : 'Days'}
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[120px]">
                                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1">Status</p>
                                <div className={`inline-flex items-center px-2 py-0.5 rounded-lg text-sm font-bold border ${
                                    request.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' :
                                    request.status === 'Rejected' ? 'bg-rose-500/20 text-rose-100 border-rose-500/30' :
                                    'bg-amber-500/20 text-amber-100 border-amber-500/30'
                                }`}>
                                    {request.status}
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[120px]">
                                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1">Start Date</p>
                                <p className="text-xl font-bold text-white">{dayjs(request.startDate).format('MMM D')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid: 2 Columns for better balance, removed History table */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                
                {/* LEFT COLUMN: Request Details (2 Cols wide) */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Request Card */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                        {/* Decorative top bar */}
                        <div className={`h-2 w-full ${
                             request.status === 'Approved' ? 'bg-green-500' :
                             request.status === 'Rejected' ? 'bg-red-500' :
                             'bg-amber-500'
                        }`}></div>

                        <div className="p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Leave Request Details</h2>
                                    <p className="text-slate-500 flex items-center">
                                         <FiClock className="w-4 h-4 mr-2" />
                                         Applied on {dayjs(request.createdAt).format('MMMM D, YYYY • h:mm A')}
                                    </p>
                                </div>
                                <div className={`px-4 py-2 rounded-full border flex items-center shadow-sm ${getStatusColor(request.status)}`}>
                                    {getStatusIcon(request.status)}
                                    <span className="font-bold uppercase tracking-wide text-xs">{request.status}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                {/* Type */}
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Leave Type</span>
                                    <div className="font-bold text-slate-800 text-sm flex items-center">
                                         <div className={`w-2 h-2 rounded-full mr-2 shadow-sm ${
                                            request.leaveType === 'Sick' ? 'bg-red-500' : 
                                            request.leaveType === 'Annual' ? 'bg-blue-500' : 'bg-yellow-500'
                                        }`}></div>
                                        {request.leaveType}
                                    </div>
                                </div>

                                {/* Total Days */}
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Days</span>
                                    <div className="font-bold text-slate-800 text-sm flex items-center">
                                        <FiClock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                        {calculateWorkingDays(request.startDate, request.endDate)} {calculateWorkingDays(request.startDate, request.endDate) === 1 ? 'Day' : 'Days'}
                                    </div>
                                </div>

                                {/* Duration Range - Spans 2 columns for better fit */}
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 md:col-span-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration</span>
                                    <div className="font-bold text-slate-800 text-sm flex items-center">
                                        <FiCalendar className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                                        <span>{dayjs(request.startDate).format('MMM D')}</span>
                                        <span className="mx-1.5 text-slate-300">→</span> 
                                        <span>{dayjs(request.endDate).format('MMM D, YYYY')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center">
                                    <FiFileText className="w-4 h-4 mr-2" />
                                    Reason for Request
                                </h3>
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-slate-700 leading-relaxed text-lg">
                                    "{request.reason}"
                                </div>
                            </div>

                            {request.attachmentUrl && (
                                <div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center">
                                    <FiFileText className="w-4 h-4 mr-2" />
                                    Attachments
                                </h3>
                                    <a 
                                        href={request.attachmentUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center p-4 bg-white border border-slate-200 rounded-xl text-indigo-600 hover:border-indigo-300 hover:shadow-md transition-all group w-full md:w-auto"
                                    >
                                        <div className="p-3 bg-indigo-50 rounded-lg mr-4 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                            <FiDownload className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-slate-800 group-hover:text-indigo-700">Download Attachment</span>
                                            <span className="text-xs text-slate-400">Click to view or download file</span>
                                        </div>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Panel (Only if Pending) */}
                    {request.status === 'Pending' && (
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transform transition-all hover:scale-[1.01] duration-300">
                            <div className="p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                            <div className="p-8">
                                <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center">
                                    <FiBriefcase className="w-5 h-5 mr-2 text-indigo-500" />
                                    Review & Action
                                </h3>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Add Comments <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none shadow-inner text-slate-700 placeholder:text-slate-300"
                                            rows={3}
                                            placeholder="Write a note explaining your decision..."
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-end gap-4 pt-2">
                                        <Button 
                                            variant="danger" 
                                            onClick={() => handleStatusUpdate('Rejected')}
                                            isLoading={updateStatusMutation.isPending}
                                            className="px-8 py-3 rounded-xl shadow-lg shadow-red-200 hover:shadow-red-300 transition-all"
                                        >
                                            Reject Request
                                        </Button>
                                        <Button 
                                            onClick={() => handleStatusUpdate('Approved')}
                                            isLoading={updateStatusMutation.isPending}
                                            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-transparent rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all font-bold"
                                        >
                                            Approve Request
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Approver Comments (If already acted upon) */}
                    {request.status !== 'Pending' && request.approverComments && (
                         <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8">
                             <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                <FiUser className="w-4 h-4 mr-2" />
                                Approver Comments
                             </h3>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-slate-600 italic leading-relaxed text-lg">"{request.approverComments}"</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Employee Context (1 Col wide) */}
                <div className="space-y-8">
                    {/* Balances Widget - Redesigned */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden sticky top-8">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <FiBriefcase className="w-5 h-5 mr-2 text-slate-400" />
                                Current Balances
                            </h3>
                            {loadingBalances && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>}
                        </div>
                        <div className="p-6 bg-slate-50/30">
                            {balances && balances.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {balances.map(balance => (
                                        <div key={balance.id} className="transform transition-transform hover:scale-[1.02]">
                                            <LeaveBalanceCard
                                                type={balance.leaveType}
                                                total={balance.totalCredits}
                                                used={balance.usedCredits}
                                                compact={true} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <FiClock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    No balance data available.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveRequestDetailsPage;
