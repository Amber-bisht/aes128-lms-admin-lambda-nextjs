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
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="max-w-[1200px] mx-auto px-6 py-32 text-center">
                <h1 className="text-4xl font-black mb-4">Access Denied</h1>
                <p className="text-gray-400">You do not have permission to view this page.</p>
                <Link href="/" className="inline-block mt-8 text-sm font-bold text-white hover:underline underline-offset-4">
                    Return Home
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-[1240px] mx-auto px-6 py-10">
            <div className="mb-10">
                <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors mb-6 group">
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Dashboard
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">User Directory</h1>
                        <p className="text-gray-400 font-medium">Monitor student progress and manage platform access.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-none overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">User Information</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Access Role</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Enrollments</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => (
                                <tr key={user.id} className="group hover:bg-white/5 transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-none bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all overflow-hidden text-lg font-black text-white/20">
                                                {user.image ? (
                                                    <img src={user.image} alt="" className="w-full h-full object-cover opacity-80" />
                                                ) : (
                                                    user.email?.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white uppercase tracking-tight">{user.name || 'Anonymous User'}</p>
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="text-[10px] font-medium">{user.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Shield className={`w-3 h-3 ${user.role === 'ADMIN' ? 'text-white' : 'text-gray-600'}`} />
                                            <span className={user.role === 'ADMIN' ? 'text-white' : ''}>{user.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-3 h-3 text-gray-500" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{user.courses?.length || 0} Courses</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {user.courses?.map((course: any) => (
                                                    <span key={course.id} className="text-[8px] font-black px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400 uppercase tracking-tighter">
                                                        {course.title}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
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
                    <div className="p-20 text-center">
                        <Users className="w-12 h-12 text-white/5 mx-auto mb-6" />
                        <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">No users found</h3>
                        <p className="text-gray-500 text-sm font-medium">Your platform hasn't gained any student momentum yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
