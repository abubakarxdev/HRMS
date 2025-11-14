
import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAppContext } from '../../contexts/AppContext';

const AttendanceReport: React.FC = () => {
    const { attendance, employees, loading } = useAppContext();
    
    const exportToCSV = () => {
        const headers = "Employee Name,Date,Clock In,Clock Out,Break Hours,Status\n";
        const rows = attendance.map(rec => {
            const employeeName = employees.find(e => e.id === rec.employeeId)?.name || 'Unknown';
            return `"${employeeName}",${rec.date},${rec.clockIn || ''},${rec.clockOut || ''},${rec.breakHours || 0},${rec.status}`;
        }).join('\n');

        const csvContent = headers + rows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "attendance_report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card title="Attendance Report" actions={<Button onClick={exportToCSV}>Export to CSV</Button>}>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Clock In</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Clock Out</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Break (hrs)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-4">Loading report...</td></tr>
                        ) : (
                            attendance.map(rec => (
                                <tr key={rec.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                        {employees.find(e => e.id === rec.employeeId)?.name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">{rec.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">{rec.clockIn || '--:--'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">{rec.clockOut || '--:--'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">{rec.breakHours || 0}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            rec.status === 'Present' ? 'bg-green-100 text-green-800' :
                                            rec.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {rec.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default AttendanceReport;