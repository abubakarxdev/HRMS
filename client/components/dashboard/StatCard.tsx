
import React from 'react';
import Card from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  return (
    <Card>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-1 text-3xl font-bold text-primary-600">{value}</p>
      </div>
    </Card>
  );
};

export default StatCard;
