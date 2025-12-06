import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useEmployees } from '../../hooks/useEmployees';
import { useAttendanceRecords } from '../../hooks/useAttendance';

const AttendanceReport: React.FC = () => {
    const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
    const { data: response, isLoading: loadingAttendance } = useAttendanceRecords(1, 1000);
    const attendance = response?.data || [];
    
    const loading = loadingEmployees || loadingAttendance;

    const getEmployeeName = (id: string) => {
        const emp = employees.find(e => e.id === id);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
    };

    const formatTime = (isoString?: string | null) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getClockIn = (rec: any) => {
        if (rec.sessions && rec.sessions.length > 0) {
            // Sort sessions by checkInTime just in case
            const sorted = [...rec.sessions].sort((a, b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime());
            return sorted[0].checkInTime;
        }
        return null;
    };

    const getClockOut = (rec: any) => {
        if (rec.sessions && rec.sessions.length > 0) {
            const sorted = [...rec.sessions].sort((a, b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime());
            const lastSession = sorted[sorted.length - 1];
            return lastSession.checkOutTime;
        }
        return null;
    };

    const exportToCSV = () => {
        const headers = "Employee Name,Date,Clock In,Clock Out,Break Hours,Status\n";
        const rows = attendance.map(rec => {
            const employeeName = getEmployeeName(rec.employeeId);
            const clockIn = formatTime(getClockIn(rec));
            const clockOut = formatTime(getClockOut(rec));
            const breakHours = ((rec.totalBreakMinutes || 0) / 60).toFixed(2);
            
            return `"${employeeName}",${rec.date},${clockIn},${clockOut},${breakHours},${rec.status}`;
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
                                        {getEmployeeName(rec.employeeId)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                                        {new Date(rec.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                                        {formatTime(getClockIn(rec))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                                        {formatTime(getClockOut(rec))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                                        {((rec.totalBreakMinutes || 0) / 60).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            rec.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                            rec.status === 'ON_LEAVE' ? 'bg-yellow-100 text-yellow-800' : 
                                            rec.status === 'ABSENT' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
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