import React, { useState, useEffect, useMemo } from 'react';
import { FiEye, FiCalendar, FiClock, FiMapPin, FiFilter, FiRefreshCw, FiUser, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEmployees } from '../../hooks/useEmployees';
import { useEmployeeAttendance, useAttendanceRecords } from '../../hooks/useAttendance';
import Button from '../ui/Button';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Autocomplete, TextField, Avatar, Box, Typography } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import FourSquare from '../ui/FourSquare';

const AttendanceLog: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: allEmployees = [] } = useEmployees();
    
    // HR Specific State
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('myself');

    // Date Filters
    const [startDate, setStartDate] = useState<Dayjs | null>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return dayjs(d);
    });
    const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

    const isHR = user?.role === "ADMIN" || user?.role === "HR";

    // Determine which employee ID to fetch
    const targetEmployeeId = selectedEmployeeId === 'myself' ? user?.employeeId || '' : selectedEmployeeId;
    
    // Fetch attendance data based on selection
    const shouldFetchEmployee = selectedEmployeeId !== 'all' && !!targetEmployeeId;
    const shouldFetchAll = selectedEmployeeId === 'all' && isHR;
    
    const { data: employeeAttendance = [], isLoading: attendanceLoading } = useEmployeeAttendance(
        shouldFetchEmployee ? targetEmployeeId : ''
    );
    
    const { data: allAttendance = [], isLoading: allAttendanceLoading } = useAttendanceRecords();

    const loading = selectedEmployeeId === 'all' ? allAttendanceLoading : attendanceLoading;
    const rawLogs = selectedEmployeeId === 'all' ? allAttendance : employeeAttendance;

    // Filter by date range
    const logs = useMemo(() => {
        const filtered = rawLogs.filter(record => {
            if (!startDate || !endDate) return true;
            const recordDate = dayjs(record.date);
            return recordDate.isAfter(startDate.startOf('day')) && recordDate.isBefore(endDate.endOf('day'));
        });
        
        // Sort by date desc
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [rawLogs, startDate, endDate]);

    const handleApplyFilters = () => {
        // Filters are applied automatically via useMemo
    };

    const handleReset = () => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        setStartDate(dayjs(d));
        setEndDate(dayjs());
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 0) return "0h 0m";
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return `${h}h ${m}m`;
    };
    
    const totalFilteredMinutes = logs.reduce((acc, record) => acc + (record.totalWorkMinutes || 0), 0);
    const averageMinutes = logs.length > 0 ? totalFilteredMinutes / logs.length : 0;
    const presentDays = logs.filter(r => r.status === 'PRESENT').length;

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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Attendance Log</h1>
                    <p className="text-slate-500 mt-1">View and manage your attendance history</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                        {logs.length} Records Found
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 group hover:border-indigo-200 transition-colors">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FiClock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Hours</p>
                        <p className="text-2xl font-bold text-slate-900">{formatDuration(totalFilteredMinutes)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 group hover:border-emerald-200 transition-colors">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <FiCalendar size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Days Present</p>
                        <p className="text-2xl font-bold text-slate-900">{presentDays}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 group hover:border-blue-200 transition-colors">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FiRefreshCw size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Avg. Daily Hours</p>
                        <p className="text-2xl font-bold text-slate-900">{formatDuration(averageMinutes)}</p>
                    </div>
                </div>
            </div>

            {/* Filters & Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Filter Bar */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto">
                            {/* Employee Selector for HR */}
                            {isHR && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Employee</label>
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
                                                className="bg-white"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '0.5rem',
                                                        backgroundColor: 'white',
                                                    }
                                                }}
                                            />
                                        )}
                                        disableClearable
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">From Date</label>
                                <DatePicker 
                                    value={startDate} 
                                    onChange={(newValue) => setStartDate(newValue)}
                                    slotProps={{ 
                                        textField: { size: 'small', fullWidth: true, className: 'bg-white' },
                                        popper: { sx: { zIndex: 99999 } }
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">To Date</label>
                                <DatePicker 
                                    value={endDate} 
                                    onChange={(newValue) => setEndDate(newValue)}
                                    slotProps={{ 
                                        textField: { size: 'small', fullWidth: true, className: 'bg-white' },
                                        popper: { sx: { zIndex: 99999 } }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button onClick={handleApplyFilters} className="flex-1 md:flex-none bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">
                                <FiFilter className="mr-2" /> Apply
                            </Button>
                            <Button variant="outline" onClick={handleReset} className="flex-1 md:flex-none bg-white hover:bg-slate-50">
                                Reset
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                {selectedEmployeeId === 'all' && (
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                                )}
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Check In</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Check Out</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Break</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Worked</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={selectedEmployeeId === 'all' ? 9 : 8} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                                            <p>Loading records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={selectedEmployeeId === 'all' ? 9 : 8} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-slate-100 p-3 rounded-full mb-3">
                                                <FiCalendar className="text-slate-400" size={24} />
                                            </div>
                                            <p className="font-medium text-slate-900">No records found</p>
                                            <p className="text-sm mt-1">Try adjusting your date filters</p>
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
                                                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs mr-3 overflow-hidden">
                                                            {employee?.avatarUrl ? (
                                                                <img src={employee.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                (employee?.firstName || 'U').charAt(0)
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-900">
                                                                {employee ? `${employee.firstName} ${employee.lastName}` : `ID: ${record.employeeId}`}
                                                            </div>
                                                            <div className="text-xs text-slate-500">{employee?.employeeIdNumber || 'Employee'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-900">
                                                    {new Date(checkIn || record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {new Date(checkIn || record.date).getFullYear()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs font-bold rounded-full border ${
                                                    record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    record.status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    record.status === 'ON_LEAVE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-slate-50 text-slate-700 border-slate-200'
                                                }`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                                                {checkIn ? new Date(checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                                                {checkOut ? new Date(checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
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
                                                <span className="text-sm font-bold text-slate-700">
                                                    {formatDuration(record.totalWorkMinutes || 0)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {hasSessions && (
                                                    <button
                                                        onClick={() => handleViewDetails(record)}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                                                        title="View Details"
                                                    >
                                                        <FiEye size={16} />
                                                        View Details
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
            </div>
        </div>
    );
};

export default AttendanceLog;
