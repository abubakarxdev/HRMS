import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEmployeeAttendance } from '../../hooks/useAttendance';
import { useMyLeaveRequests } from '../../hooks/useLeaves';
import Card from '../ui/Card';
import AttendanceCard from '../attendance/AttendanceCard';
import AttendanceSummaryCard from '../attendance/AttendanceSummaryCard';
import FourSquare from '../ui/FourSquare';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: attendanceResponse, isLoading: attendanceLoading } = useEmployeeAttendance(user?.employeeId || '');
  const { data: response, isLoading: leavesLoading } = useMyLeaveRequests(1, 5, 'Pending'); // Fetch recent 5 pending requests
  const attendanceHistory = attendanceResponse?.data || [];

  // Prepare chart data - last 7 days
  const chartData = useMemo(() => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Use local date string YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      last7Days.push(`${year}-${month}-${day}`);
    }

    // Create a map of effective date -> record to avoid double counting
    const recordMap = new Map();
    attendanceHistory.forEach(r => {
        let dateStr = '';
        // Try to find a session that matches the date first
        if (r.sessions && r.sessions.length > 0) {
            const firstSession = r.sessions[0];
            if (firstSession.checkInTime) {
                const sessionDate = new Date(firstSession.checkInTime);
                const sYear = sessionDate.getFullYear();
                const sMonth = String(sessionDate.getMonth() + 1).padStart(2, '0');
                const sDay = String(sessionDate.getDate()).padStart(2, '0');
                dateStr = `${sYear}-${sMonth}-${sDay}`;
            }
        }

        // Fallback to record date if no session date derived
        if (!dateStr) {
            const recordDate = new Date(r.date);
            const rYear = recordDate.getFullYear();
            const rMonth = String(recordDate.getMonth() + 1).padStart(2, '0');
            const rDay = String(recordDate.getDate()).padStart(2, '0');
            dateStr = `${rYear}-${rMonth}-${rDay}`;
        }
        
        // If multiple records map to same date (unlikely but possible), keep the one with most minutes
        if (recordMap.has(dateStr)) {
            const existing = recordMap.get(dateStr);
            if ((r.totalWorkMinutes || 0) > (existing.totalWorkMinutes || 0)) {
                recordMap.set(dateStr, r);
            }
        } else {
            recordMap.set(dateStr, r);
        }
    });

    const hoursPerDay = last7Days.map(dateStr => {
      const record = recordMap.get(dateStr);
      // Convert minutes to hours
      const hours = record?.totalWorkMinutes ? (record.totalWorkMinutes / 60) : 0;
      return Number(hours.toFixed(2)); // Keep 2 decimals for precision
    });

    return {
      labels: last7Days.map(dateStr => {
        // Parse YYYY-MM-DD manually to avoid timezone shifts
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Hours Worked',
          data: hoursPerDay,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [attendanceHistory]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            if (value === 0) return '0h 0m';
            const h = Math.floor(value);
            const m = Math.round((value - h) * 60);
            return `${h}h ${m}m`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value + ' hrs';
          }
        }
      },
    },
  };

  if (attendanceLoading || leavesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FourSquare />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.firstName || user.email.split('@')[0];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-700">
          Welcome back, {displayName}!
        </h2>
      </div>

      {/* Attendance Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AttendanceSummaryCard />
        <AttendanceCard />
      </div>

      {/* Attendance Chart */}
      <Card title="Attendance Summary - Last 7 Days">
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </Card>

      {/* Leave Request Status - Placeholder for now */}
      {/* Leave Request Status */}
      <Card title="Pending Leave Requests">
        {response?.data && response.data.length > 0 ? (
          <div className="space-y-4">
            {response.data.map((request: any) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    request.leaveType === 'Sick' ? 'bg-red-100 text-red-600' :
                    request.leaveType === 'Annual' ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{request.leaveType} Leave</p>
                    <p className="text-sm text-slate-500">
                      {new Date(request.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(request.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    Pending
                  </span>
                </div>
              </div>
            ))}
            <div className="text-center pt-2">
              <a href="/leaves" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All History &rarr;</a>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No pending leave requests</p>
            <a href="/leaves" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2 inline-block">View History &rarr;</a>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
