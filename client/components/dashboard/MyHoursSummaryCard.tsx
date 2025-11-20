import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { useAppContext } from '../../contexts/AppContext';
import { api } from '../../services/apiService';

const InfoRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline">
        <p className="text-slate-600">{label}</p>
        <p className="font-semibold text-slate-800 text-lg font-mono">{value}</p>
    </div>
);

const formatHoursMinutes = (totalHours: number): string => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
};

const MyHoursSummaryCard: React.FC = () => {
    const { user } = useAppContext();
    const [workedHours, setWorkedHours] = useState({ today: 0, week: 0, month: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Use the same API as AttendanceDashboard
                const stats = await api.getStats(user.employeeId);
                
                setWorkedHours({
                    today: stats.hoursToday || 0,
                    week: stats.hoursThisWeek || 0,
                    month: stats.hoursThisMonth || 0,
                });
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch stats', error);
                setLoading(false);
            }
        };

        fetchStats();

        // Update every minute
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [user.employeeId]);

    return (
        <Card title="My Hours Summary">
            {loading ? (
                <div className="text-center text-slate-500 py-4">Loading...</div>
            ) : (
                <div className="space-y-3">
                    <InfoRow label="Logged Today" value={formatHoursMinutes(workedHours.today)} />
                    <InfoRow label="Logged This Week" value={formatHoursMinutes(workedHours.week)} />
                    <InfoRow label="Logged This Month" value={formatHoursMinutes(workedHours.month)} />
                </div>
            )}
        </Card>
    );
};

export default MyHoursSummaryCard;