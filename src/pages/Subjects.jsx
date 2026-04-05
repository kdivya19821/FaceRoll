import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import { getPeriods, savePeriod, removePeriod } from '../utils/storage';

export default function Subjects() {
    const navigate = useNavigate();
    const [periods, setPeriods] = useState(getPeriods());
    const [newPeriod, setNewPeriod] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newPeriod.trim()) return;
        savePeriod(newPeriod);
        setPeriods(getPeriods());
        setNewPeriod('');
    };

    const handleDelete = (p) => {
        removePeriod(p);
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

            <form onSubmit={handleAdd} className="mb-8 flex space-x-3">
                <input
                    type="text"
                    placeholder="New Subject/Period Name"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded-2xl py-4 px-5 font-semibold outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 placeholder:text-zinc-600 transition-all"
                />
                <button
                    type="submit"
                    disabled={!newPeriod.trim()}
                    className="bg-orange-500 text-white p-4 rounded-2xl flex items-center justify-center hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition-all font-bold shadow-lg shadow-orange-500/20"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 pb-10 scrollbar-hide">
                {periods.length === 0 && (
                    <div className="text-center mt-10 p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed">
                        <p className="text-zinc-500 font-medium">No subjects recorded.</p>
                    </div>
                )}
                {periods.map(p => (
                    <div key={p} className="flex items-center justify-between bg-zinc-900 border border-zinc-800/80 p-4 rounded-2xl shadow-xl hover:border-zinc-700 transition-colors">
                        <span className="font-bold text-zinc-200">{p}</span>
                        <button onClick={() => handleDelete(p)} className="p-2 bg-red-500/5 hover:bg-red-500/10 rounded-full transition-colors group">
                            <Trash2 className="w-5 h-5 text-red-500/60 group-hover:text-red-500" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
