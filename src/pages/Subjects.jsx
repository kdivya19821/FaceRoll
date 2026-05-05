import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Clock } from 'lucide-react';
import { getPeriods, savePeriod, removePeriod } from '../utils/storage';

export default function Subjects() {
    const navigate = useNavigate();
    const [periods, setPeriods] = useState(getPeriods());
    const [newPeriod, setNewPeriod] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('09:45');

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newPeriod.trim()) return;
        savePeriod(newPeriod, startTime, endTime);
        setPeriods(getPeriods());
        setNewPeriod('');
    };

    const handleDelete = (p) => {
        const name = typeof p === 'string' ? p : p.periodName;
        removePeriod(name);
        setPeriods(getPeriods());
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-zinc-950 px-4 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate('/')} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition border border-zinc-700">
                    <ArrowLeft className="w-6 h-6 text-zinc-300" />
                </button>
                <h2 className="text-xl font-bold tracking-tight text-white">Manage Subjects</h2>
                <div className="w-10"></div>
            </div>

            <form onSubmit={handleAdd} className="mb-8 space-y-4 bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800/50 shadow-2xl">
                <input
                    type="text"
                    placeholder="Subject Name (e.g. Mathematics)"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl py-4 px-5 font-semibold outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 placeholder:text-zinc-600 transition-all"
                />
                
                <div className="flex items-end space-x-3">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Start Time</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
                        />
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">End Time</label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newPeriod.trim()}
                        className="bg-orange-500 text-white p-3.5 rounded-xl flex items-center justify-center hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition-all font-bold shadow-lg shadow-orange-500/20"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 pb-10 scrollbar-hide">
                {periods.length === 0 && (
                    <div className="text-center mt-10 p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed">
                        <p className="text-zinc-500 font-medium">No subjects recorded.</p>
                    </div>
                )}
                {periods.map(p => {
                    const name = typeof p === 'string' ? p : p.periodName;
                    const timing = typeof p === 'object' && p.startTime ? `${p.startTime} - ${p.endTime}` : 'No timing set';
                    
                    return (
                        <div key={name} className="flex items-center justify-between bg-zinc-900 border border-zinc-800/80 p-5 rounded-3xl shadow-xl hover:border-zinc-700 transition-all group">
                            <div className="space-y-1">
                                <span className="font-bold text-zinc-100 text-lg block">{name}</span>
                                <div className="flex items-center space-x-1.5 text-zinc-500">
                                    <Clock className="w-3.5 h-3.5 text-orange-500/60" />
                                    <span className="text-xs font-medium">{timing}</span>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(name)} className="p-3 bg-red-500/5 hover:bg-red-500/10 rounded-2xl transition-colors group">
                                <Trash2 className="w-5 h-5 text-red-500/40 group-hover:text-red-500" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
