import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Trash2, Users, Search, GraduationCap } from 'lucide-react';
import { getStudents, saveStudent, removeStudent } from '../utils/storage';

export default function Students() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [newStudent, setNewStudent] = useState({ id: '', name: '' });
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        setStudents(getStudents());
    }, []);

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newStudent.id || !newStudent.name) return;
        
        saveStudent({ id: Number(newStudent.id), name: newStudent.name });
        setStudents(getStudents());
        setNewStudent({ id: '', name: '' });
        setShowAddForm(false);
    };

    const handleDelete = (id) => {
        if (confirm(`Are you sure you want to remove student ID #${id}?`)) {
            removeStudent(id);
            setStudents(getStudents());
        }
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.id.toString().includes(searchQuery)
    );

    return (
        <div className="flex flex-col h-[100dvh] bg-zinc-950 px-4 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate('/')} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition border border-zinc-700 shadow-lg">
                    <ArrowLeft className="w-6 h-6 text-zinc-300" />
                </button>
                <h2 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 tracking-tight">MANAGE STUDENTS</h2>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`p-2 rounded-full transition-all border ${showAddForm ? 'bg-rose-500 border-rose-400 rotate-45 text-white' : 'bg-violet-500 border-violet-400 text-white shadow-lg shadow-violet-500/20'}`}
                >
                    <UserPlus className="w-6 h-6" />
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAdd} className="bg-zinc-900 border border-violet-500/30 rounded-3xl p-6 mb-8 animate-in zoom-in duration-300 shadow-2xl">
                    <h3 className="text-sm font-black text-violet-400 uppercase tracking-widest mb-4 flex items-center">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Add New Student
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Student ID (Number)</label>
                            <input 
                                type="number" 
                                required
                                value={newStudent.id}
                                onChange={(e) => setNewStudent({...newStudent, id: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-bold"
                                placeholder="e.g. 101"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                            <input 
                                type="text"
                                required
                                value={newStudent.name}
                                onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-bold"
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <button type="submit" className="w-full bg-violet-500 hover:bg-violet-600 text-white font-black py-4 rounded-xl shadow-xl shadow-violet-500/20 transition-all uppercase tracking-widest text-sm translate-y-1">
                            Save Student
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
                    placeholder="Search by name or ID..."
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-2xl py-3.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm font-medium"
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-10 scrollbar-hide">
                <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Student List</span>
                    <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">{filteredStudents.length} TOTAL</span>
                </div>
                
                {filteredStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Users className="w-16 h-16 mb-4" />
                        <p className="font-bold">No students found</p>
                    </div>
                ) : (
                    filteredStudents.map((s, index) => (
                        <div key={s.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg shadow-violet-500/10">
                                    {s.id}
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="font-bold text-white text-base leading-tight">{s.name}</h4>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Verified ID</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDelete(s.id)}
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
