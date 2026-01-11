import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useMyUpcomingApprovedLeaves, useLeaveBalances } from '../../hooks/useLeaves';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { toast } from 'sonner';
import { uploadFile } from '../../api/services/upload.service';
import { leavesService } from '../../api/services/leaves.service';
import { LeaveType } from '../../api/types/leaves';
import { Upload, X, FileText } from 'lucide-react';

interface LeaveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { user } = useAuth();
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [duration, setDuration] = useState('FULL_DAY');
    const [reason, setReason] = useState('');
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [attachmentName, setAttachmentName] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Fetch upcoming approved leaves for validation
    const { data: approvedLeaves = [] } = useMyUpcomingApprovedLeaves();
    // Fetch balances to check for Archival status
    const { data: balances = [] } = useLeaveBalances();

    useEffect(() => {
        if (isOpen) {
            fetchLeaveTypes();
        }
    }, [isOpen]);

    const fetchLeaveTypes = async () => {
        try {
            const types = await leavesService.getLeaveTypes();
            setLeaveTypes(types);
            
            // Auto-select first ACTIVE type
            if (types.length > 0 && !selectedTypeId) {
                const firstActive = types.find(t => {
                    const bal = balances.find(b => b.leaveTypeId === t.id);
                    return !bal?.isArchived;
                });
                if (firstActive) setSelectedTypeId(firstActive.id);
                else setSelectedTypeId(types[0].id); // Fallback
            }
        } catch (error) {
            console.error("Failed to fetch leave types", error);
            toast.error("Failed to load leave types");
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadFile(file);
            setAttachmentUrl(url);
            setAttachmentName(file.name);
            toast.success("File uploaded successfully");
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    const removeAttachment = () => {
        setAttachmentUrl('');
        setAttachmentName('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Client-side validation
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        if (start < today) {
            toast.error("Leave requests cannot be for past dates.");
            setLoading(false);
            return;
        }

        if (start > end) {
            toast.error("Start date cannot be after end date");
            setLoading(false);
            return;
        }

        const selectedType = leaveTypes.find(t => t.id === selectedTypeId);

        // Check for overlaps with approved leaves
        const hasOverlap = approvedLeaves.some(leave => {
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);
            return (start <= leaveEnd && end >= leaveStart);
        });

        if (hasOverlap) {
            toast.error("You already have an approved leave for the selected dates.");
            setLoading(false);
            return;
        }
        
        // Final Archival Check (Client Side)
        const balance = balances.find(b => b.leaveTypeId === selectedTypeId);
        if (balance?.isArchived) {
             toast.error("This leave type is archived and cannot be used for new requests.");
             setLoading(false);
             return;
        }

        try {
            await onSubmit({ leaveTypeId: selectedTypeId, startDate, endDate, reason, attachmentUrl, duration });
            toast.success("Leave request submitted successfully");
            onClose();
            // Reset form
            setStartDate('');
            setEndDate('');
            setReason('');
            setAttachmentUrl('');
            setAttachmentName('');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to submit request.");
        } finally {
            setLoading(false);
        }
    };

    const selectedType = leaveTypes.find(t => t.id === selectedTypeId);
    const allowHalfDay = selectedType?.allowHalfDay;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Request Leave">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                    <select
                        value={selectedTypeId}
                        onChange={(e) => setSelectedTypeId(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    >
                         {leaveTypes.map(type => {
                             const isArchived = balances.find(b => b.leaveTypeId === type.id)?.isArchived;
                             return (
                                <option key={type.id} value={type.id} disabled={!!isArchived}>
                                    {type.name} {isArchived ? '(Archived - Unavailable)' : ''}
                                </option>
                             );
                         })}
                    </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                if (!endDate || new Date(e.target.value) > new Date(endDate)) {
                                    setEndDate(e.target.value);
                                }
                            }}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            min={startDate || new Date().toISOString().split('T')[0]}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                </div>

                {/* Duration Field - Only show for Single Day AND if Allowed */}
                {startDate && endDate && startDate === endDate && allowHalfDay && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="FULL_DAY">Full Day</option>
                            <option value="HALF_DAY_AM">First Half (AM)</option>
                            <option value="HALF_DAY_PM">Second Half (PM)</option>
                        </select>
                    </div>
                )}
                 {startDate && endDate && startDate === endDate && !allowHalfDay && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                        Note: Half-day requests are not enabled for {selectedType?.name}.
                    </div>
                )}


                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Please describe the reason for your leave..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Attachment (Optional)</label>
                    
                    {!attachmentUrl ? (
                        <div className="flex items-center justify-center w-full">
                            <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {uploading ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                    ) : (
                                        <>
                                            <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                            <p className="text-xs text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        </>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={handleFileChange} 
                                    disabled={uploading}
                                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                />
                            </label>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                            <div className="flex items-center overflow-hidden">
                                <FileText className="w-5 h-5 text-indigo-500 mr-2 flex-shrink-0" />
                                <span className="text-sm text-indigo-700 truncate max-w-[200px]">{attachmentName || "Attached File"}</span>
                            </div>
                            <button
                                type="button"
                                onClick={removeAttachment}
                                className="text-indigo-400 hover:text-red-500 transition-colors p-1"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                     {user?.role === 'ADMIN' && (
                        <div className="flex-1 flex items-center text-xs text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 mr-2">
                             Note: Your leave will be auto-approved as per company policy.
                        </div>
                     )}
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading || uploading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading || uploading}>
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default LeaveRequestModal;
