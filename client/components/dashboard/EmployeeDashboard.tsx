import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { api } from '../../services/apiService';
import { AttendanceStats, AttendanceRecord } from '../../types';
import Card from '../ui/Card';
import AttendanceCard from '../attendance/AttendanceCard';
import AttendanceSummaryCard from '../attendance/AttendanceSummaryCard';
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
  const { user } = useAppContext();
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.employeeId) return;
      try {
        const historyData = await api.getAttendanceForEmployee(user.employeeId);
        setAttendanceHistory(historyData);
      } catch (error) {
        console.error('Failed to fetch employee dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.employeeId]);

  // Prepare chart data - last 7 days
  const chartData = useMemo(() => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    const hoursPerDay = last7Days.map(date => {
      const record = attendanceHistory.find(r => r.date.split('T')[0] === date);
      return record?.totalHours || 0;
    });

    return {
      labels: last7Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-700">
          Welcome back, {user.name.split(' ')[0]}!
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
