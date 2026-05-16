import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Trash2, Users, Search, Landmark, KeyRound, BookOpen } from 'lucide-react';
import { getTeachers, saveTeacher, removeTeacher } from '../utils/storage';

export default function Teachers() {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [newTeacher, setNewTeacher] = useState({ name: '', password: '', subjects: '' });
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        setTeachers(getTeachers());
    }, []);

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newTeacher.name || !newTeacher.password) return;
        
        const subjectList = newTeacher.subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        saveTeacher({ 
            name: newTeacher.name, 
            password: newTeacher.password, 
            subjects: subjectList 
        });
        
        setTeachers(getTeachers());
        setNewTeacher({ name: '', password: '', subjects: '' });
        setShowAddForm(false);
    };

    const handleDelete = (id, name) => {
        if (confirm(`Are you sure you want to remove teacher "${name}"?`)) {
            removeTeacher(id);
            setTeachers(getTeachers());
        }
    };

    const filteredTeachers = teachers.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-[100dvh] bg-zinc-950 px-4 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate('/')} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition border border-zinc-700 shadow-lg">
                    <ArrowLeft className="w-6 h-6 text-zinc-300" />
                </button>
                <h2 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-tight uppercase">Manage Teachers</h2>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`p-2 rounded-full transition-all border ${showAddForm ? 'bg-rose-500 border-rose-400 rotate-45 text-white' : 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'}`}
                >
                    <UserPlus className="w-6 h-6" />
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAdd} className="bg-zinc-900 border border-indigo-500/30 rounded-3xl p-6 mb-8 animate-in zoom-in duration-300 shadow-2xl">
                    <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center">
                        <Landmark className="w-4 h-4 mr-2" />
                        Add New Teacher
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                            <input 
                                type="text"
                                required
                                value={newTeacher.name}
                                onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                                placeholder="e.g. Ms. Smith"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Login Password</label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input 
                                    type="text"
                                    required
                                    value={newTeacher.password}
                                    onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                                    placeholder="e.g. smith@faceroll"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Assigned Subjects (Comma Separated)</label>
                            <div className="relative">
                                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input 
                                    type="text"
                                    value={newTeacher.subjects}
                                    onChange={(e) => setNewTeacher({...newTeacher, subjects: e.target.value})}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                                    placeholder="e.g. Physics, Math"
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 rounded-xl shadow-xl shadow-indigo-500/20 transition-all uppercase tracking-widest text-sm translate-y-1">
                            Save Teacher
                        </button>
                    </div>
                </form>
            )}

            <div className="relative mb-6">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Search className="w-4 h-4" />
                </div>
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search teachers..."
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-2xl py-3.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium"
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-10 scrollbar-hide">
                <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Faculty Directory</span>
                    <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">{filteredTeachers.length} TOTAL</span>
                </div>
                
                {filteredTeachers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Users className="w-16 h-16 mb-4" />
                        <p className="font-bold">No teachers found</p>
                    </div>
                ) : (
                    filteredTeachers.map((t, index) => (
                        <div 
                            key={t.name} 
                            className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-2 duration-300 hover:border-indigo-500/50 hover:bg-zinc-800/80 transition-all group" 
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform">
                                    {t.name.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="font-bold text-white text-base leading-tight group-hover:text-indigo-300 transition-colors">{t.name}</h4>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {(t.subjects || []).slice(0, 2).map(s => (
                                            <span key={s} className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md border border-zinc-700 font-bold uppercase tracking-tighter">
                                                {s}
                                            </span>
                                        ))}
                                        {(t.subjects || []).length > 2 && <span className="text-[8px] text-zinc-600 font-bold">+{t.subjects.length - 2} more</span>}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDelete(t.id, t.name)}
                                className="p-2.5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
