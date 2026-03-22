"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Users, Mail, Shield, BookOpen, ChevronLeft, Loader2, Calendar } from "lucide-react";

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    useEffect(() => {
        if (status === "authenticated" && isAdmin) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
                headers: {
                    "Authorization": `Bearer ${(session as any).appToken}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    setUsers(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [status, isAdmin, session]);

    if (status === "loading" || (loading && isAdmin)) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600/20" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="max-w-[1240px] mx-auto px-6 py-32 text-center italic font-sans">
                <h1 className="text-6xl font-black mb-6 uppercase tracking-tighter text-gray-900 leading-none">Access <span className="text-blue-600">Denied</span></h1>
                <p className="text-gray-400 text-sm uppercase font-black tracking-widest mb-12">Insufficient administrative clearance detected.</p>
                <Link href="/" className="inline-block px-10 py-5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-xl shadow-gray-200">
                    Evacuate to Safety
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 relative selection:bg-blue-100 italic font-sans pb-32">
            {/* Background Mesh & Grid */}
            <div className="fixed inset-0 bg-gradient-mesh opacity-40 z-0 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-[0.02] z-0 pointer-events-none" />

            <div className="max-w-[1240px] mx-auto px-6 py-16 relative z-10">
                <div className="mb-16">
                    <Link href="/admin" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors mb-10 group">
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Infrastructure Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="h-1 w-8 bg-blue-600 rounded-full" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Administrative Control</p>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter mb-4 uppercase text-gray-900 leading-none">User <span className="text-blue-600">Curators</span></h1>
                            <p className="text-gray-400 font-medium italic">Monitoring student momentum and architectural growth indicators.</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 px-6 py-3 rounded-2xl flex items-center gap-4">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{users.length} Active Students</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[3rem] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.05)] ring-8 ring-white/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50 bg-gray-50/50">
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">User Profile</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Clearance</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Vault Access</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Admission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map((user) => (
                                    <tr key={user.id} className="group hover:bg-blue-50/30 transition-all duration-500">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-700 overflow-hidden text-xl font-black">
                                                    {user.image ? (
                                                        <img src={user.image} alt="" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                                                    ) : (
                                                        <span className="text-gray-200 group-hover:text-white">{user.email?.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors leading-none mb-2">{user.name || 'Anonymous'}</p>
                                                    <div className="flex items-center gap-3 text-gray-300 group-hover:text-gray-400 transition-colors">
                                                        <Mail className="w-3 h-3" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest tabular-nums">{user.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl border ${user.role === 'ADMIN' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                                    <Shield className="w-4 h-4" />
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'text-blue-600' : 'text-gray-300'}`}>{user.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-3">
                                                    <BookOpen className="w-4 h-4 text-gray-300" />
                                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">{user.courses?.length || 0} Modules</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {user.courses?.slice(0, 3).map((course: any) => (
                                                        <span key={course.id} className="text-[8px] font-black px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-400 uppercase tracking-tighter italic hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                                            {course.title}
                                                        </span>
                                                    ))}
                                                    {user.courses?.length > 3 && (
                                                        <span className="text-[8px] font-black px-3 py-1.5 rounded-lg bg-gray-900 text-white uppercase tracking-tighter">+{user.courses.length - 3} More</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3 text-gray-300 bg-gray-50/50 w-fit px-5 py-2.5 rounded-xl border border-gray-100 group-hover:bg-white group-hover:border-blue-100 transition-all duration-700">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest tabular-nums text-gray-400">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {users.length === 0 && (
                        <div className="py-32 bg-gray-50/50 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-center mb-8 shadow-sm">
                                <Users className="w-8 h-8 text-gray-100" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-4">No Students Recruited</h3>
                            <p className="text-gray-400 text-sm max-w-sm font-medium italic">Wait for architectural enthusiasts to join your premium curriculum.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
