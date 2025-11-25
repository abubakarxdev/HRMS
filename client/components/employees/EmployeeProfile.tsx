import React, { useState, useEffect, useCallback } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAppContext } from '../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { NAVIGATION_PATHS } from '../../constants';
import { api } from '../../services/apiService';
import { Employee, AttendanceRecord, AuditLog } from '../../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ProfileAttendanceWidget from './ProfileAttendanceWidget';
import { Clock, Calendar, TrendingUp, Coffee } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EmployeeProfileProps {
  employeeId: string;
}

const InfoField: React.FC<{ label: string, value?: string }> = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-1 text-sm text-slate-900">{value || 'N/A'}</p>
  </div>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({
  icon,
  label,
  value,
  color,
}) => (
  <div className="bg-white rounded-lg border border-slate-200 p-4">
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-600">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  </div>
);

const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ employeeId }) => {
  const { employees, user } = useAppContext();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empData, attData, logData] = await Promise.all([
        api.getEmployeeById(employeeId),
        api.getAttendanceForEmployee(employeeId),
        api.getAuditLogsForEmployee(employeeId),
      ]);
      setEmployee(empData || null);
      setAttendance(attData);
      setAuditLogs(logData);
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);
  
  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <div className="text-center py-8">Loading profile...</div>;
  if (!employee) return <div className="text-center py-8">Employee not found.</div>;

  const manager = employees.find(e => e.employeeId === employee.managerId);
  const isOwnProfile = user.employeeId === employee.employeeId;

  // Calculate attendance statistics
  const now = new Date();
  const currentMonthStr = now.toLocaleDateString('en-CA', { month: '2-digit', year: 'numeric', timeZone: 'Asia/Karachi' }); // YYYY-MM
  
  // Get start of current week (Monday)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Filter records
  const thisMonthRecords = attendance.filter(r => {
      const rDate = new Date(r.date);
      return rDate.toLocaleDateString('en-CA', { month: '2-digit', year: 'numeric', timeZone: 'Asia/Karachi' }) === currentMonthStr;
  });

  const thisWeekRecords = attendance.filter(r => {
      const rDate = new Date(r.date);
      return rDate >= startOfWeek;
  });

  // Calculate working days in current month (Total Mon-Fri)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  let workingDaysInMonth = 0;
  const curDate = new Date(startOfMonth);
  while (curDate <= endOfMonth) {
      const d = curDate.getDay();
      if (d !== 0 && d !== 6) workingDaysInMonth++;
      curDate.setDate(curDate.getDate() + 1);
  }

  const calculateStats = (records: AttendanceRecord[]) => {
      return records.reduce((acc, rec) => {
          let hours = 0;
          let breakHours = 0;
          if (rec.sessions) {
              rec.sessions.forEach(session => {
                  if (session.type === 'WORK' && session.checkOut) {
                      const start = new Date(session.checkIn).getTime();
                      const end = new Date(session.checkOut).getTime();
                      hours += (end - start) / (1000 * 60 * 60);
                  } else if (session.type === 'BREAK' && session.checkOut) {
                      const start = new Date(session.checkIn).getTime();
                      const end = new Date(session.checkOut).getTime();
                      breakHours += (end - start) / (1000 * 60 * 60);
                  }
              });
          } else if (rec.totalHours) {
              hours = rec.totalHours;
          }
          return {
              totalHours: acc.totalHours + hours,
              totalBreakHours: acc.totalBreakHours + breakHours,
              daysPresent: acc.daysPresent + (hours > 0 ? 1 : 0),
          };
      }, { totalHours: 0, totalBreakHours: 0, daysPresent: 0 });
  };

  const monthStats = calculateStats(thisMonthRecords);
  const weekStats = calculateStats(thisWeekRecords);

  // Last 30 days for chart only
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const last30Days = attendance.filter(r => new Date(r.date) >= thirtyDaysAgo);

  const avgHoursPerDay = monthStats.daysPresent > 0 
    ? monthStats.totalHours / monthStats.daysPresent 
    : 0;

  // Prepare chart data
  const chartData = last30Days.map(rec => {
    let hours = 0;
    
    if (rec.sessions) {
      rec.sessions.forEach(session => {
        if (session.type === 'WORK' && session.checkOut) {
          const start = new Date(session.checkIn).getTime();
          const end = new Date(session.checkOut).getTime();
          hours += (end - start) / (1000 * 60 * 60);
        }
      });
    } else if (rec.totalHours) {
      hours = rec.totalHours;
    }
    
    return {
      date: new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: parseFloat(hours.toFixed(2)),
    };
  });

  const chartConfig = {
    labels: chartData.map(d => d.date),
    datasets: [
      {
        label: 'Hours Worked',
        data: chartData.map(d => d.hours),
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(79, 70, 229, 0.8)');
          gradient.addColorStop(1, 'rgba(79, 70, 229, 0.2)');
          return gradient;
        },
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const hours = Math.floor(context.parsed.y);
            const minutes = Math.round((context.parsed.y - hours) * 60);
            return `${hours}h ${minutes}m`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value + 'h';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
          <img 
            className="h-32 w-32 rounded-full object-cover" 
            src={employee.avatar || `https://placehold.co/200x200/4F46E5/FFFFFF?text=${employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}`}
            alt="Employee Avatar"
            onError={(e) => {
              const initials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              e.currentTarget.src = `https://placehold.co/200x200/4F46E5/FFFFFF?text=${initials}`;
            }}
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">{employee.name}</h2>
            <p className="text-lg text-primary-600">{employee.position}</p>
            <p className="text-md text-slate-600">{employee.department}</p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoField label="Email" value={employee.email} />
              <InfoField label="Hire Date" value={new Date(employee.hireDate).toLocaleDateString()} />
              <InfoField label="Manager" value={manager?.name} />
              <InfoField label="Status" value={employee.status} />
            </div>
          </div>
          <div>
            {user?.role === 'ADMIN_HR' && (
              <Button onClick={() => navigate(`${NAVIGATION_PATHS.EMPLOYEES}/edit/${employee.id}`)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={isOwnProfile ? "lg:col-span-2" : "lg:col-span-3"}>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<Clock className="w-5 h-5 text-blue-600" />}
              label="Total Hours (Month)"
              value={formatHours(monthStats.totalHours)}
              color="bg-blue-50"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-green-600" />}
              label="Avg/Day (Month)"
              value={formatHours(avgHoursPerDay)}
              color="bg-green-50"
            />
            <StatCard
              icon={<Calendar className="w-5 h-5 text-purple-600" />}
              label="Attendance (W | M)"
              value={`W:${weekStats.daysPresent}/5 | M:${monthStats.daysPresent}/${workingDaysInMonth}`}
              color="bg-purple-50"
            />
            <StatCard
              icon={<Coffee className="w-5 h-5 text-orange-600" />}
              label="Break Time (Month)"
              value={formatHours(monthStats.totalBreakHours)}
              color="bg-orange-50"
            />
          </div>

          {/* Chart */}
          <Card title="Attendance Overview (Last 30 Days)">
            <div style={{ height: '350px' }}>
              <Bar data={chartConfig} options={chartOptions} />
            </div>
          </Card>
        </div>
        {isOwnProfile && (
            <div className="lg:col-span-1">
                <ProfileAttendanceWidget employee={employee} />
            </div>
        )}
      </div>

      <Card title="Audit Log">
        <ul className="divide-y divide-slate-200 max-h-80 overflow-y-auto">
          {auditLogs.length > 0 ? (
            auditLogs.map(log => (
              <li key={log.id} className="py-3">
                <p className="text-sm font-medium text-slate-800">{log.action} by {log.user}</p>
                <p className="text-sm text-slate-500">{log.details}</p>
                <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
              </li>
            ))
          ) : (
            <li className="py-4 text-center text-slate-500">No audit logs available</li>
          )}
        </ul>
      </Card>
    </div>
  );
};

export default EmployeeProfile;