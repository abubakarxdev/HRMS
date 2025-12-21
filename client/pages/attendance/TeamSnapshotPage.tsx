import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useOptionalOffice } from '@/contexts/OfficeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useAttendanceRecords, useTeamStats } from '@/hooks/useAttendance';
import EmployeeAttendanceCard from '@/components/attendance/EmployeeAttendanceCard';
import { Users, Clock, Filter, RefreshCw, Layers } from 'lucide-react';

const TeamSnapshotPage: React.FC = () => {
    const { user } = useAuth();
    const { officeId: paramOfficeId } = useParams<{ officeId: string }>();
    const officeContext = useOptionalOffice();
    
    // Priority: 1. Admin Switcher (Context) 2. URL Param 3. User's assigned office
    const currentOfficeId = officeContext?.currentOfficeId || paramOfficeId || user?.officeId;
    
    const { data: employees = [], isLoading: loadingEmployees } = useEmployees(currentOfficeId);
    const userTimezone = user?.timezone || 'Asia/Karachi';
    const todayLocal = useMemo(() => new Date().toLocaleDateString('en-CA', { timeZone: userTimezone }), [userTimezone]);

    // Fetch today's records
    const { data: response, isLoading: loadingAttendance, refetch } = useAttendanceRecords(1, 200, todayLocal, todayLocal, undefined, currentOfficeId);
    const allRecords = response?.data || [];
    
    // Fetch Team Stats (Weekly/Monthly Progress)
    const { data: teamStats, isLoading: loadingStats } = useTeamStats(currentOfficeId);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const attendanceByEmployee = useMemo(() => {
        const map = new Map();
        allRecords.forEach(a => map.set(String(a.employeeId), a));
        return map;
    }, [allRecords]);

    const getEmployeeStatus = (employeeId: string): string => {
        const record = attendanceByEmployee.get(String(employeeId));
        if (!record) return 'absent';
        if (record.status === 'ON_LEAVE') return 'on-leave';
        
        const openSession = record.sessions?.find((s: any) => !s.checkOutTime);
        if (openSession) {
            const onBreak = openSession.breaks?.some((b: any) => !b.endTime);
            if (onBreak) return 'on-break';
            return 'present';
        }
        
        if (record.sessions?.length > 0 && record.sessions.every((s: any) => s.checkOutTime)) {
             return 'checked-out';
        }
        return 'absent';
    };

    const filteredEmployees = useMemo(() => {
        if (statusFilter === 'all') return employees;
        return employees.filter(emp => getEmployeeStatus(emp.id) === statusFilter);
    }, [employees, statusFilter, attendanceByEmployee]);

    const loading = loadingEmployees || loadingAttendance || loadingStats;

    // Counts for Header
    const counts = useMemo(() => {
        const c = { present: 0, absent: 0, onBreak: 0, checkedOut: 0, onLeave: 0 };
        employees.forEach(emp => {
             const status = getEmployeeStatus(emp.id);
             if (status === 'present') c.present++;
             else if (status === 'absent') c.absent++;
             else if (status === 'on-break') c.onBreak++;
             else if (status === 'checked-out') c.checkedOut++;
             else if (status === 'on-leave') c.onLeave++;
        });
        return c;
    }, [employees, attendanceByEmployee]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Glassmorphism Header */}
            <header className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                 <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>

                 <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <Users className="w-8 h-8 text-white/80" />
                             <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
                        </div>
                        <p className="text-indigo-100 max-w-lg text-lg">
                            Real-time insights into your team's attendance and performance targets.
                        </p>
                    </div>

                    <div className="flex flex-col items-end">
                         <div className="text-4xl font-bold font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-indigo-200">
                             {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                         </div>
                         <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium uppercase tracking-wider mt-1">
                             <Clock className="w-4 h-4" />
                             {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                         </div>
                    </div>
                 </div>

                 {/* Quick Stats Row */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/20">
                      {[ 
                          { label: 'Present', count: counts.present, color: 'text-emerald-300' },
                          { label: 'Checked Out', count: counts.checkedOut, color: 'text-blue-300' },
                          { label: 'On Leave', count: counts.onLeave, color: 'text-purple-300' },
                          { label: 'Absent', count: counts.absent, color: 'text-rose-300' },
                      ].map((stat, idx) => (
                          <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex flex-col items-center">
                              <span className={`text-2xl font-bold ${stat.color}`}>{stat.count}</span>
                              <span className="text-xs text-white/70 uppercase font-semibold">{stat.label}</span>
                          </div>
                      ))}
                 </div>
            </header>

            {/* Controls */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-20 mx-1">
                 <div className="flex items-center gap-2 text-slate-500">
                     <Layers className="w-5 h-5" />
                     <span className="font-semibold">{employees.length} Employees</span>
                     <span className="h-4 w-px bg-slate-300 mx-2"></span>
                     <span className="text-sm">Showing {filteredEmployees.length}</span>
                 </div>
                 
                 <div className="flex gap-3">
                      <div className="relative">
                          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-slate-100"
                          >
                            <option value="all">All Statuses</option>
                            <option value="present">Present</option>
                            <option value="checked-out">Checked Out</option>
                            <option value="on-leave">On Leave</option>
                            <option value="absent">Absent</option>
                          </select>
                      </div>
                      <button 
                        onClick={() => refetch()} 
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition-colors"
                        title="Refresh Data"
                      >
                          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                 </div>
            </div>

            {/* Grid */}
            {loading && employees.length === 0 ? (
                <div className="flex justify-center py-20">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                    {filteredEmployees.map(employee => (
                        <EmployeeAttendanceCard
                            key={employee.id}
                            employee={employee}
                            todayRecord={attendanceByEmployee.get(String(employee.id))}
                            stats={teamStats?.[String(employee.id)]}
                        />
                    ))}
                    
                    {filteredEmployees.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-lg font-medium">No employees found matching filter</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamSnapshotPage;