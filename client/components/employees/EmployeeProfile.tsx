
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAppContext } from '../../contexts/AppContext';
import { api } from '../../services/apiService';
import { Employee, AttendanceRecord, AuditLog } from '../../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ProfileAttendanceWidget from './ProfileAttendanceWidget';

interface EmployeeProfileProps {
  employeeId: string;
}

const InfoField: React.FC<{ label: string, value?: string }> = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-1 text-sm text-slate-900">{value || 'N/A'}</p>
  </div>
);

const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ employeeId }) => {
  const { employees, user } = useAppContext();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [empData, attData, logData] = await Promise.all([
      api.getEmployeeById(employeeId),
      api.getAttendanceForEmployee(employeeId),
      api.getAuditLogsForEmployee(employeeId),
    ]);
    setEmployee(empData || null);
    setAttendance(attData);
    setAuditLogs(logData);
    setLoading(false);
  }, [employeeId]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div>Loading profile...</div>;
  if (!employee) return <div>Employee not found.</div>;

  const manager = employees.find(e => e.id === employee.managerId);
  const isOwnProfile = user.employeeId === employeeId;

  const attendanceChartData = attendance.map(rec => {
    let hours = 0;
    if (rec.clockIn && rec.clockOut) {
      const duration = (new Date(`1970-01-01T${rec.clockOut}:00Z`).getTime() - new Date(`1970-01-01T${rec.clockIn}:00Z`).getTime()) / 3600000;
      hours = duration - (rec.breakHours || 0);
    }
    return {
      date: rec.date,
      hours: hours > 0 ? hours.toFixed(2) : 0,
    };
  }).slice(-10);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
          <img className="h-32 w-32 rounded-full object-cover" src={employee.avatar} alt="Employee Avatar" />
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
            <Button>Edit Profile</Button>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={isOwnProfile ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card title="Attendance Overview (Last 10 Records)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hours" stroke="#4f46e5" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
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
          {auditLogs.map(log => (
            <li key={log.id} className="py-3">
              <p className="text-sm font-medium text-slate-800">{log.action} by {log.user}</p>
              <p className="text-sm text-slate-500">{log.details}</p>
              <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default EmployeeProfile;