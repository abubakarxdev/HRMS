import React, { useState } from 'react';
import { useHolidays, useAddHoliday } from '../../hooks/useHolidays';
import { PublicHoliday } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

interface ManageHolidaysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageHolidaysModal: React.FC<ManageHolidaysModalProps> = ({ isOpen, onClose }) => {
  const { data: holidays = [] } = useHolidays();
  const addHolidayMutation = useAddHoliday();
  const [date, setDate] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date && name) {
      const newHoliday: PublicHoliday = { date, name };
      addHolidayMutation.mutate(newHoliday, {
        onSuccess: () => {
            setDate('');
            setName('');
        }
      });
    }
  };
  
  const currentYear = new Date().getFullYear();
  const currentYearHolidays = holidays.filter(h => h.date.startsWith(String(currentYear)));

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <Card 
            title={`Public Holidays - ${currentYear}`}
            actions={<Button variant="ghost" size="sm" onClick={onClose}>&times;</Button>}
        >
            <div className="space-y-4">
                <form onSubmit={handleSubmit} className="flex items-end space-x-2 pb-4 border-b border-slate-200">
                    <Input 
                        label="Date"
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)}
                        required
                    />
                    <Input 
                        label="Holiday Name"
                        type="text"
                        placeholder="e.g., National Day"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                    <Button type="submit" size="md" isLoading={addHolidayMutation.isPending}>Add</Button>
                </form>

                <div className="max-h-60 overflow-y-auto">
                    <ul className="divide-y divide-slate-100">
                        {currentYearHolidays.length > 0 ? currentYearHolidays.map(holiday => (
                            <li key={holiday.date} className="py-2 flex justify-between">
                                <span className="font-medium text-slate-800">{holiday.name}</span>
                                <span className="text-slate-500">{new Date(holiday.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
                            </li>
                        )) : (
                            <li className="py-2 text-center text-slate-500">No holidays added for this year.</li>
                        )}
                    </ul>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default ManageHolidaysModal;
