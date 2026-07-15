import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateField } from '../store.ts';
import { RootState } from '../store.ts';

export default function FollowUpScheduler({ formState }: { formState: any }) {
  const dispatch = useDispatch();

  const handleQuickSchedule = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split('T')[0];
    dispatch(updateField({ field: 'followUpDate', value: dateStr }));
  };

  const handleDownloadIcs = () => {
    if (!formState.followUpDate || !formState.hcpName) return;

    const [year, month, day] = formState.followUpDate.split('-');
    const startDate = `${year}${month}${day}T090000`;
    const endDate = `${year}${month}${day}T100000`;

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Studio//HCP Interaction Tracker//EN
BEGIN:VEVENT
UID:${new Date().getTime()}@aistudio.build
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:Follow-up with ${formState.hcpName}
DESCRIPTION:${formState.followUpActions || 'Follow-up meeting.'}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `follow_up_${formState.hcpName.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-3">
      <div className="flex gap-2 mb-2">
        <button type="button" onClick={() => handleQuickSchedule(7)} className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors">1 Week</button>
        <button type="button" onClick={() => handleQuickSchedule(14)} className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors">2 Weeks</button>
        <button type="button" onClick={() => handleQuickSchedule(30)} className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors">1 Month</button>
      </div>
      {formState.followUpDate && formState.hcpName && (
        <button 
          type="button" 
          onClick={handleDownloadIcs}
          className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          Add to Calendar
        </button>
      )}
    </div>
  );
}
