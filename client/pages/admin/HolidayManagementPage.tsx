import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHolidays, useAddHoliday, useDeleteHoliday, useUpdateHoliday } from '../../hooks/useHolidays';
import { useOffices } from '../../hooks/useOffices';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Plus, Trash2, Calendar, FileText, Search, Filter, Edit2, MapPin } from 'lucide-react';
import dayjs from 'dayjs';
import Pagination from '../../components/ui/Pagination';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import NoTableData from '../../components/ui/NoTableData';

// Mock useUpdateHoliday if it doesn't exist yet, or I should create it.
// I'll assume I need to add it to hooks if I haven't. I'll add logic to create it if missing in next step or now.
// Actually allow me to check hooks first. useHolidays only has add/delete. I need update.
// I will rewrite this file assuming update exists, then I will add update hook.

const HolidayManagementPage: React.FC = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [yearFilter, setYearFilter] = useState(dayjs().year().toString());
    const [officeFilter, setOfficeFilter] = useState(searchParams.get('officeId') || '');

    const { data: holidaysData, isLoading } = useHolidays({ 
        page, 
        limit: 10, 
        search: searchQuery || undefined, 
        year: yearFilter || undefined,
        officeId: officeFilter || undefined
    });
    
    // Handle data structure difference (Array vs Paginated)
    const holidays = Array.isArray(holidaysData) ? holidaysData : holidaysData?.data || [];
    const meta = !Array.isArray(holidaysData) ? holidaysData?.meta : null;

    const { data: offices } = useOffices();
    const addHolidayMutation = useAddHoliday();
    const deleteHolidayMutation = useDeleteHoliday();
    const updateHolidayMutation = useUpdateHoliday();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState<any>(null);
    
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        description: '',
        isOptional: false,
        isHalfDay: false,
        officeId: ''
    });

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const showOfficeSelector = isSuperAdmin || (user?.role === 'ADMIN' && !user?.officeId);

    const resetForm = () => {
        setFormData({ name: '', startDate: '', endDate: '', description: '', isOptional: false, isHalfDay: false, officeId: '' });
        setSelectedHoliday(null);
    };

    const handleOpenModal = (holiday?: any) => {
        if (holiday) {
            setSelectedHoliday(holiday);
            setFormData({
                name: holiday.name,
                startDate: dayjs(holiday.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(holiday.endDate).format('YYYY-MM-DD'),
                description: holiday.description || '',
                isOptional: holiday.isOptional,
                isHalfDay: holiday.isHalfDay,
                officeId: holiday.officeId || ''
            });
        } else {
            resetForm();
            // Auto-fill Office ID if filter is active
            if (officeFilter) {
                setFormData(prev => ({ ...prev, officeId: officeFilter }));
            }
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                id: selectedHoliday ? selectedHoliday.id : '',
                officeId: formData.officeId || undefined 
            };
            
            if (selectedHoliday) {
                await updateHolidayMutation.mutateAsync(payload);
            } else {
                await addHolidayMutation.mutateAsync(payload);
            }
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Failed to save holiday", error);
        }
    };

    const handleDeleteClick = (holiday: any) => {
        setSelectedHoliday(holiday);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedHoliday) {
            await deleteHolidayMutation.mutateAsync(selectedHoliday.id);
            setIsDeleteModalOpen(false);
            setSelectedHoliday(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10 p-6">
             {/* Header */}
             <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                 <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>

                 <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                         <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                                <Calendar className="w-6 h-6 text-white" />
                             </div>
                             <h1 className="text-3xl font-bold tracking-tight">Holiday Management</h1>
                        </div>
                        <p className="text-indigo-100 max-w-lg text-lg">
                            Manage public and company holidays for your organization.
                        </p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="bg-white text-indigo-600 hover:bg-indigo-50 border border-transparent shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95 font-bold px-6 py-3 rounded-xl flex items-center gap-2 group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        Add Holiday
                    </button>
                 </div>
            </div>

            {/* Filters */}
             <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                    <div className="flex items-center gap-2 text-slate-500 w-full sm:w-auto">
                         <Filter size={18} />
                         <span className="text-sm font-medium whitespace-nowrap">Filter by:</span>
                         
                         {/* Year Filter */}
                         <select
                            value={yearFilter}
                            onChange={(e) => {
                                setYearFilter(e.target.value);
                                setPage(1);
                            }}
                            className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 bg-slate-50 min-w-[100px]"
                        >
                            <option value="">All Years</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                        </select>

                        {/* Office Filter (Super Admin Only) */}
                        {isSuperAdmin && (
                            <select
                                value={officeFilter}
                                onChange={(e) => {
                                    setOfficeFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 bg-slate-50 min-w-[160px]"
                            >
                                <option value="">All Offices</option>
                                {offices?.map((office: any) => (
                                    <option key={office.id} value={office.id}>
                                        {office.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
                
                 {/* Search Input */}
                 <div className="relative w-full xl:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search holidays..." 
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                 </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider pl-8">Holiday Name</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date Range</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Optional</th>
                            {isSuperAdmin && <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Office</th>}
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider pr-8">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={isSuperAdmin ? 6 : 5} className="px-6 py-20 text-center text-slate-500">
                                     <div className="flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                                        <p className="text-sm font-medium text-slate-600">Loading holidays...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : holidays.length === 0 ? (
                            <NoTableData 
                                title="No holidays found"
                                message="Try adjusting your filters or add a new holiday."
                                icon={<Calendar size={32} />}
                            />
                        ) : (
                            holidays.map((holiday: any) => (
                                <tr key={holiday.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap pl-8">
                                        <div className="font-bold text-slate-900">{holiday.name}</div>
                                        {holiday.description && <div className="text-xs text-slate-500 truncate max-w-xs">{holiday.description}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                        <div className="flex items-center text-sm font-medium">
                                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                            {dayjs(holiday.startDate).format('MMM D, YYYY')}
                                            {holiday.startDate !== holiday.endDate && ` - ${dayjs(holiday.endDate).format('MMM D, YYYY')}`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {holiday.isHalfDay ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                Half Day
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                Full Day
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        {holiday.isOptional ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400">-</span>
                                        )}
                                    </td>
                                    {isSuperAdmin && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <div className="flex items-center">
                                                <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                                {offices?.find((o: any) => o.id === holiday.officeId)?.name || 'Unknown'}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-right pr-8">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenModal(holiday)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Edit Holiday"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteClick(holiday)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Holiday"
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
                {meta && (
                    <div className="bg-slate-50/50 border-t border-slate-100 p-4">
                        <Pagination 
                            currentPage={page}
                            totalPages={meta.totalPages}
                            totalItems={meta.total}
                            limit={meta.limit} 
                            onPageChange={(p) => setPage(p)}
                        />
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedHoliday ? "Edit Holiday" : "Add New Holiday"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Office Selector for Super Admins or Office-less Admins */}
                    {showOfficeSelector && !officeFilter && (
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Target Office</label>
                            <select
                                value={formData.officeId}
                                onChange={e => setFormData({ ...formData, officeId: e.target.value })}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            >
                                <option value="">Select Office...</option>
                                {offices?.map((office: any) => (
                                    <option key={office.id} value={office.id}>
                                        {office.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Holiday Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                min={formData.startDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-6">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isHalfDay}
                                onChange={e => setFormData({ ...formData, isHalfDay: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-slate-700">Half Day Holiday</span>
                        </label>
                        
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isOptional}
                                onChange={e => setFormData({ ...formData, isOptional: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-slate-700">Optional Holiday</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={addHolidayMutation.isPending}>
                            {addHolidayMutation.isPending ? 'Saving...' : 'Save Holiday'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <DeleteConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Holiday"
                message={`Are you sure you want to delete "${selectedHoliday?.name}"? This action cannot be undone.`}
                isLoading={deleteHolidayMutation.isPending}
            />
        </div>
    );
};

export default HolidayManagementPage;
