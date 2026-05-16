import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTimetable, saveTimetable, getPeriods } from '../utils/storage';
import { Clock, Plus, Trash2, Check, X, ArrowLeft } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIOD_COUNT = 4; // Number of periods per day

export default function Timetable() {
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [editingCell, setEditingCell] = useState(null); // { day, period }
  const [tempValue, setTempValue] = useState('');
  const [periodCount, setPeriodCount] = useState(4);

  useEffect(() => {
    const data = getTimetable();
    setTimetable(Array.isArray(data) ? {} : data);
    
    // Load saved period count or default to 4
    const savedCount = localStorage.getItem('smart_attendance_period_count');
    if (savedCount) setPeriodCount(parseInt(savedCount));

    const teacherPeriods = getPeriods();
    setSubjects(teacherPeriods.map(p => typeof p === 'string' ? p : p.periodName));
  }, []);

  const addPeriodRow = () => {
    const newCount = periodCount + 1;
    setPeriodCount(newCount);
    localStorage.setItem('smart_attendance_period_count', newCount);
  };

  const removePeriodRow = () => {
    if (periodCount <= 1) return;
    const newCount = periodCount - 1;
    setPeriodCount(newCount);
    localStorage.setItem('smart_attendance_period_count', newCount);
  };

  const startEditing = (day, period) => {
    setEditingCell({ day, period });
    setTempValue(timetable[day]?.[period] || '');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setTempValue('');
  };

  const updateCell = () => {
    const newTimetable = { ...timetable };
    if (!newTimetable[editingCell.day]) newTimetable[editingCell.day] = {};
    newTimetable[editingCell.day][editingCell.period] = tempValue;
    setTimetable(newTimetable);
    saveTimetable(newTimetable);
    setEditingCell(null);
  };

  const clearCell = (day, period) => {
    const newTimetable = { ...timetable };
    if (newTimetable[day]) {
      delete newTimetable[day][period];
      setTimetable(newTimetable);
      saveTimetable(newTimetable);
    }
  };

  return (
    <div className="flex flex-col flex-1 p-6 space-y-6 animate-in fade-in zoom-in duration-500 min-h-screen bg-zinc-950">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Weekly Timetable</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={removePeriodRow}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition-colors"
            title="Remove Period Row"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={addPeriodRow}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-indigo-400 transition-colors"
            title="Add Period Row"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-500/20 ml-2">
            Teacher Portal
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-900/50 shadow-2xl backdrop-blur-xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-900/80">
              <th className="p-4 text-left text-xs font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 w-20">Period</th>
              {DAYS.map(day => (
                <th key={day} className="p-4 text-center text-xs font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 min-w-[120px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: periodCount }).map((_, i) => {
              const periodNum = i + 1;
              const periodTimes = {
                1: '09:00',
                2: '09:45',
                3: '10:45',
                4: '11:30'
              };
              const timeLabel = periodTimes[periodNum] || '';

              return (
                <tr key={periodNum} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 bg-zinc-900/30 text-center">
                    <span className="font-black text-zinc-600 text-sm block">{periodNum}</span>
                    {timeLabel && <span className="text-[10px] font-bold text-indigo-500/50">{timeLabel}</span>}
                  </td>
                  {DAYS.map(day => {
                    const isEditing = editingCell?.day === day && editingCell?.period === periodNum;
                    const value = timetable[day]?.[periodNum] || '';
                    
                    return (
                      <td key={day} className="p-2 border-l border-zinc-800/50 relative group">
                        {isEditing ? (
                          <div className="flex flex-col space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <select
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              autoFocus
                              className="w-full bg-zinc-800 text-white rounded-xl px-2 py-1.5 text-xs border border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">Select Subject</option>
                              {subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <div className="flex justify-end space-x-1">
                              <button onClick={updateCell} className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={cancelEditing} className="p-1 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => startEditing(day, periodNum)}
                            className={`min-h-[60px] p-2 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                              value 
                                ? value === 'Break' || value === 'Lunch'
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                  : 'bg-indigo-500/10 text-indigo-100 border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                                : 'bg-zinc-800/20 text-zinc-600 border border-dashed border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            {value ? (
                              <>
                                <span className="text-[11px] font-bold tracking-tight leading-tight">{value}</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    clearCell(day, periodNum);
                                  }}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-500 transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <Plus className="w-4 h-4 opacity-20 group-hover:opacity-100 group-hover:text-indigo-400 transition-all" />
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
