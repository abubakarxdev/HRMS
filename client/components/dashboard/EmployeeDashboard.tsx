import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEmployeeAttendance } from '../../hooks/useAttendance';
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
  const { data: response, isLoading } = useEmployeeAttendance(user?.employeeId || '');
  const attendanceHistory = response?.data || [];

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

  if (isLoading) {
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
      <Card title="Leave Requests">
        <div className="text-center py-8 text-slate-500">
          <p>No leave requests to display</p>
          <p className="text-sm mt-2">Leave management feature coming soon</p>
        </div>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
