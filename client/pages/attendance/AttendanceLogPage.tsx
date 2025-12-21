import React, { useState, useEffect, useMemo } from 'react';
import { FiEye, FiCalendar, FiClock, FiMapPin, FiFilter, FiRefreshCw, FiUser, FiActivity, FiLayers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useEmployeeAttendance } from '@/hooks/useAttendance';
import { useAttendanceRecords } from '@/hooks/useAttendance';
import Button from '@/components/ui/Button';
import { Autocomplete, TextField, Avatar, Box, Typography } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import Select from '@/components/ui/Select';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useOptionalOffice } from '@/contexts/OfficeContext';
import Pagination from '@/components/ui/Pagination';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

const AttendanceLogPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const officeContext = useOptionalOffice();
    const currentOfficeId = officeContext?.currentOffice?.id;
    
    // Pass officeId to employee fetch
    const { data: allEmployees = [] } = useEmployees(currentOfficeId);
    
    // HR Specific State
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('myself');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [quickRange, setQuickRange] = useState<string>('last30');
    // Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Default dates
    const DEFAULT_START = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
    const DEFAULT_END = dayjs().format('YYYY-MM-DD');

    // Date State (Strings, synced directly like LeavesPage)
    const [startDate, setStartDate] = useState<string>(DEFAULT_START);
    const [endDate, setEndDate] = useState<string>(DEFAULT_END);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [selectedEmployeeId, statusFilter, startDate, endDate]);

    const isHR = user?.role === "ADMIN" || user?.role === "HR";

    // Determine which employee ID to fetch
    const targetEmployeeId = selectedEmployeeId === 'myself' ? user?.employeeId || '' : selectedEmployeeId;
    
    // Fetch attendance data based on selection
    const shouldFetchEmployee = selectedEmployeeId !== 'all' && !!targetEmployeeId;
    
    const { data: employeeAttendanceData, isLoading: attendanceLoading } = useEmployeeAttendance(
        shouldFetchEmployee ? targetEmployeeId : '',
        shouldFetchEmployee && startDate ? startDate : undefined,
        shouldFetchEmployee && endDate ? endDate : undefined,
        statusFilter,
        page,
        limit
    );
    
    // Pass officeId to get filtered records for 'All Employees' view (when HR/Admin)
    const { data: allAttendanceData, isLoading: allAttendanceLoading } = useAttendanceRecords(
        page,
        limit,
        startDate ? startDate : undefined,
        endDate ? endDate : undefined,
        statusFilter,
        currentOfficeId // Pass officeId
    );

    const loading = selectedEmployeeId === 'all' ? allAttendanceLoading : attendanceLoading;
    const response = selectedEmployeeId === 'all' ? allAttendanceData : employeeAttendanceData;
    const logs = response?.data || [];
    const meta = response?.meta;

    const handleQuickRangeChange = (range: string) => {
        setQuickRange(range);
        const today = dayjs();
        
        let newStart: Dayjs | null = null;
        let newEnd: Dayjs | null = null;

        switch (range) {
            case 'today':
                newStart = today;
                newEnd = today;
                break;
            case 'thisWeek':
                newStart = today.startOf('isoWeek');
                newEnd = today.endOf('isoWeek');
                break;
            case 'lastWeek':
                newStart = today.subtract(1, 'week').startOf('isoWeek');
                newEnd = today.subtract(1, 'week').endOf('isoWeek');
                break;
            case 'thisMonth':
                newStart = today.startOf('month');
                newEnd = today.endOf('month');
                break;
            case 'lastMonth':
                newStart = today.subtract(1, 'month').startOf('month');
                newEnd = today.subtract(1, 'month').endOf('month');
                break;
            case 'last30':
                newStart = today.subtract(30, 'day');
                newEnd = today;
                break;
            case 'custom':
                return; 
            default:
                break;
        }

        if (newStart && newEnd) {
            setStartDate(newStart.format('YYYY-MM-DD'));
            setEndDate(newEnd.format('YYYY-MM-DD'));
        }
    };

    const handleReset = () => {
        setQuickRange('last30');
        setStatusFilter('all');
        setStartDate(DEFAULT_START);
        setEndDate(DEFAULT_END);
    };

    // Check if filters are modified
    const isFiltered = useMemo(() => {
        return (
            statusFilter !== 'all' ||
            quickRange !== 'last30' ||
            startDate !== DEFAULT_START ||
            endDate !== DEFAULT_END
        );
    }, [statusFilter, quickRange, startDate, endDate, DEFAULT_START, DEFAULT_END]);

    const formatDuration = (minutes: number) => {
        if (minutes < 0) return "0h 0m";
        const h = Math.floor(minutes / 60);
        const m = Math.ceil(minutes % 60); // Round up to match session details
        return `${h}h ${m}m`;
    };
    
    // Use aggregates from backend if available, otherwise fallback to page stats (for transition)
    const aggregates = response?.aggregates;
    
    // Total Hours
    const totalFilteredMinutes = aggregates?.totalWorkMinutes ?? logs.reduce((acc, record) => acc + (record.totalWorkMinutes || 0), 0);
    
    // Days Present
    const presentDays = aggregates?.totalDaysPresent ?? logs.filter(r => r.status === 'PRESENT').length;
    
    // Avg Daily Hours - use total days present for accurate average, or total records if simpler
    // Using days present as denominator makes more sense for "Average Daily Hours Worked"
    const avgDenominator = presentDays > 0 ? presentDays : 1;
    const averageMinutes = totalFilteredMinutes / avgDenominator;

    const getSessionTimes = (record: any) => {
        if (!record.sessions || record.sessions.length === 0) return { checkIn: null, checkOut: null };
        
        const sortedSessions = [...record.sessions].sort((a, b) => 
            new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime()
        );
        
        const firstSession = sortedSessions[0];
        const lastSession = sortedSessions[sortedSessions.length - 1];
        
        return {
            checkIn: firstSession.checkInTime,
            checkOut: lastSession.checkOutTime
        };
    };

    const handleViewDetails = (record: any) => {
        navigate(`/attendance/session/${record.id}`);
    };

    // Helper to get employee details
    const getEmployeeDetails = (recordEmployeeId: string) => {
        return allEmployees.find(e => e.id === recordEmployeeId);
    };

    // Type for employee options
    type EmployeeOption = {
        label: string;
        id: string;
        type: 'special' | 'employee';
        avatar?: string;
        position?: string;
        rawId?: string;
    };

    // Prepare options for Autocomplete
    const employeeOptions = useMemo<EmployeeOption[]>(() => {
        const options: EmployeeOption[] = [
            { label: 'All Employees', id: 'all', type: 'special' },
            { label: 'My Attendance', id: 'myself', type: 'special' },
            ...allEmployees.map(emp => ({
                label: `${emp.firstName} ${emp.lastName}`,
                id: emp.id,
                type: 'employee' as const,
                avatar: emp.avatarUrl,
                position: emp.employeeIdNumber,
                rawId: emp.id
            }))
        ];
        return options;
    }, [allEmployees]);

    const selectedOption = useMemo(() => {
        return employeeOptions.find(opt => opt.id === selectedEmployeeId) || employeeOptions[1];
    }, [selectedEmployeeId, employeeOptions]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Glassmorphism Header */}
            <header className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                 <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>

                 <div className="relative z-10 flex flex-col justify-between gap-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                 <FiCalendar className="w-8 h-8 text-white/80" />
                                 <h1 className="text-3xl font-bold tracking-tight">Attendance Log</h1>
                            </div>
                            <p className="text-indigo-100 max-w-lg text-lg">
                                Comprehensive history of attendance records and sessions.
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                            <span className="text-sm font-medium text-indigo-100 uppercase tracking-wider">Total Records</span>
                            <div className="text-3xl font-bold font-mono text-white">{meta?.total || 0}</div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 mt-2 border-t border-white/10">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-lg text-emerald-300">
                                <FiClock size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{formatDuration(totalFilteredMinutes)}</p>
                                <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider">Total Hours</p>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-lg text-amber-300">
                                <FiCalendar size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{presentDays}</p>
                                <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider">Days Present</p>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center gap-4">
                             <div className="p-3 bg-white/10 rounded-lg text-blue-300">
                                <FiActivity size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{formatDuration(averageMinutes)}</p>
                                <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider">Avg Daily</p>
                            </div>
                        </div>
                    </div>
                 </div>
            </header>

            {/* Filters & Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative z-10">
                {/* Filter Bar */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col xl:flex-row gap-4 items-end xl:items-center justify-between">
                        <div className="flex flex-col md:flex-row flex-wrap gap-4 w-full xl:w-auto items-end md:items-center">
                            
                            {/* Employee Selector for HR */}
                            {isHR && (
                                <div className="w-full md:w-64">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Employee</label>
                                    <Autocomplete
                                        options={employeeOptions}
                                        getOptionLabel={(option) => option.label}
                                        value={selectedOption}
                                        onChange={(_, newValue) => {
                                            if (newValue) setSelectedEmployeeId(newValue.id);
                                        }}
                                        renderOption={(props, option) => (
                                            <Box component="li" {...props} key={option.id}>
                                                {option.type === 'employee' ? (
                                                    <div className="flex items-center gap-3 w-full">
                                                        <Avatar 
                                                            src={option.avatar} 
                                                            alt={option.label}
                                                            sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                                                        >
                                                            {option.label.charAt(0)}
                                                        </Avatar>
                                                        <div>
                                                            <Typography variant="body2" className="font-medium text-slate-900">
                                                                {option.label}
                                                            </Typography>
                                                            <Typography variant="caption" className="text-slate-500 block -mt-0.5">
                                                                {option.position}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Typography variant="body2" className="font-medium text-indigo-600">
                                                        {option.label}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                        renderInput={(params) => (
                                            <TextField 
                                                {...params} 
                                                size="small" 
                                                fullWidth 
                                                className="bg-white shadow-sm"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '0.75rem',
                                                        backgroundColor: 'white',
                                                        '& fieldset': { borderColor: '#e2e8f0' },
                                                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                        '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                                    }
                                                }}
                                            />
                                        )}
                                        disableClearable
                                    />
                                </div>
                            )}

                            {/* Quick Range */}
                            <div className="min-w-[160px]">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Range Preset</label>
                                <Select
                                    value={quickRange}
                                    onChange={(e) => handleQuickRangeChange(e.target.value)}
                                    className="bg-white shadow-sm border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg w-full py-2"
                                    options={[
                                        { value: 'last30', label: 'Last 30 Days' },
                                        { value: 'today', label: 'Today' },
                                        { value: 'thisWeek', label: 'This Week' },
                                        { value: 'lastWeek', label: 'Last Week' },
                                        { value: 'thisMonth', label: 'This Month' },
                                        { value: 'lastMonth', label: 'Last Month' },
                                        { value: 'custom', label: 'Custom Range' },
                                    ]}
                                />
                            </div>

                            {/* Date Inputs - Always Visible & Synced */}
                            <div className="flex items-center gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">From</label>
                                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                                        <input 
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => {
                                                setStartDate(e.target.value);
                                                setQuickRange('custom'); // Switch to custom if user manually edits
                                            }}
                                            className="text-sm text-slate-600 outline-none bg-transparent font-medium w-full"
                                        />
                                    </div>
                                </div>
                                <div className="self-end pb-2 text-slate-400">-</div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">To</label>
                                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                                        <input 
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => {
                                                setEndDate(e.target.value);
                                                setQuickRange('custom');
                                            }}
                                            className="text-sm text-slate-600 outline-none bg-transparent font-medium w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Status Filter */}
                            <div className="min-w-[140px]">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Status</label>
                                <Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-white shadow-sm border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg w-full py-2"
                                    options={[
                                        { value: 'all', label: 'All Statuses' },
                                        { value: 'PRESENT', label: 'Present' },
                                        { value: 'ABSENT', label: 'Absent' },
                                        { value: 'OFF', label: 'Off' },
                                        { value: 'ON_LEAVE', label: 'On Leave' },
                                        { value: 'HALF_DAY', label: 'Half Day' },
                                    ]}
                                />
                            </div>
                        </div>

                        {/* Reset Button - Conditional */}
                        {isFiltered && (
                            <div className="flex-shrink-0 animate-in fade-in zoom-in duration-200">
                                <Button 
                                    variant="outline" 
                                    onClick={handleReset} 
                                    className="bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200 hover:border-indigo-200 rounded-lg font-semibold transition-all px-4 py-2 h-auto"
                                >
                                    Reset Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                {selectedEmployeeId === 'all' && (
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                )}
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Check In</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Check Out</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Break</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Worked</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={selectedEmployeeId === 'all' ? 9 : 8} className="px-6 py-20 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                                            <p className="text-lg font-medium text-slate-700">Loading records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={selectedEmployeeId === 'all' ? 9 : 8} className="px-6 py-20 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-slate-50 p-6 rounded-full mb-4 border border-slate-100">
                                                <FiLayers className="text-slate-300" size={48} />
                                            </div>
                                            <p className="font-bold text-lg text-slate-900">No records found</p>
                                            <p className="text-slate-500 mt-1">Try adjusting your date filters or status</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((record) => {
                                    const { checkIn, checkOut } = getSessionTimes(record);
                                    const location = record.sessions?.[0]?.location || '-';
                                    const breakMinutes = record.totalBreakMinutes || 0;
                                    const hasSessions = (record.sessions?.length || 0) > 0;
                                    const employee = selectedEmployeeId === 'all' ? getEmployeeDetails(record.employeeId) : null;
                                    
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                                            {selectedEmployeeId === 'all' && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs mr-3 overflow-hidden border border-indigo-200">
                                                            {employee?.avatarUrl ? (
                                                                <img src={employee.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                (employee?.firstName || 'U').charAt(0)
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-slate-900">
                                                                {employee ? `${employee.firstName} ${employee.lastName}` : `ID: ${record.employeeId}`}
                                                            </div>
                                                            <div className="text-xs text-slate-500">{employee?.employeeIdNumber || 'Employee'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    {new Date(checkIn || record.date).toLocaleDateString('en-US', { 
                                                        weekday: 'short', 
                                                        month: 'short', 
                                                        day: 'numeric',
                                                        timeZone: user?.timezone || 'Asia/Karachi'
                                                    })}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {new Date(checkIn || record.date).toLocaleDateString('en-US', { 
                                                        year: 'numeric',
                                                        timeZone: user?.timezone || 'Asia/Karachi'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm ${
                                                    record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    record.status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    record.status === 'ON_LEAVE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    record.status === 'OFF' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                                                    'bg-slate-50 text-slate-700 border-slate-200'
                                                }`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-mono font-medium">
                                                {checkIn ? dayjs(checkIn).tz(user?.timezone || 'Asia/Karachi').format('hh:mm A') : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-mono font-medium">
                                                {checkOut ? dayjs(checkOut).tz(user?.timezone || 'Asia/Karachi').format('hh:mm A') : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {formatDuration(breakMinutes)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <FiMapPin size={14} className="text-slate-400" />
                                                    {location}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                    {formatDuration(record.totalWorkMinutes || 0)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {hasSessions && (
                                                    <button
                                                        onClick={() => handleViewDetails(record)}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-xs font-bold shadow-sm shadow-indigo-200"
                                                        title="View Details"
                                                    >
                                                        <FiEye size={14} />
                                                        Details
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {/* Pagination Controls */}
                {meta && (
                    <div className="bg-slate-50/50 border-t border-slate-100">
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
        </div>
    );
};

export default AttendanceLogPage;
