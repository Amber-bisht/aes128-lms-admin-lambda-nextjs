"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Users, Mail, Shield, BookOpen, ChevronLeft, Loader2, Calendar, AlertTriangle, Globe, MapPin } from "lucide-react";

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
            <div className="max-w-[1240px] mx-auto px-6 py-32 text-center font-sans">
                <h1 className="text-6xl font-bold mb-6 uppercase tracking-tighter text-gray-900 leading-none">Access <span className="text-blue-600">Denied</span></h1>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-12">Insufficient administrative clearance detected.</p>
                <Link href="/" className="inline-block px-10 py-4 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-none hover:bg-blue-600 transition-all shadow-xl shadow-gray-100">
                    Return to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 relative selection:bg-blue-100 font-sans pb-32">
            {/* Background Mesh & Grid */}
            <div className="fixed inset-0 bg-gradient-mesh opacity-80 z-0 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-100 z-0 pointer-events-none" />

            <div className="max-w-[1240px] mx-auto px-6 py-16 relative z-10">
                <div className="mb-16">
                    <Link href="/admin" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors mb-10 group">
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Admin Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="h-0.5 w-6 bg-blue-600" />
                                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-600">Admin Console</p>
                            </div>
                            <h1 className="text-5xl font-bold tracking-tighter mb-4 uppercase text-gray-900 leading-none">User <span className="text-blue-600">Management</span></h1>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 px-6 py-3 rounded-none flex items-center gap-4">
                            <Users className="w-5 h-5 text-gray-400" />
                            <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">{users.length} Active Users</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-none overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">User Profile</th>
                                    <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Security</th>
                                    <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Access History</th>
                                    <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Clearance</th>
                                    <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Courses</th>
                                    <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map((user) => (
                                    <tr key={user.id} className="group hover:bg-blue-50/30 transition-all duration-500">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <p className="text-lg font-bold text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors leading-none mb-2">{user.name || user.email.split('@')[0]}</p>
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <Mail className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">{user.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col gap-2">
                                                {user.flags?.length > 0 ? (
                                                    <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-none">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        <span className="text-[9px] font-bold uppercase tracking-widest">{user.flags[0].type}</span>
                                                        <span className="text-[7px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-none">{user.flags.length}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-gray-300 border border-gray-50 px-3 py-2 rounded-none opacity-50">
                                                        <Shield className="w-3 h-3" />
                                                        <span className="text-[9px] font-bold uppercase tracking-widest">Clear</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col gap-3">
                                                {/* Geo Location Header */}
                                                <div className="flex items-center gap-2 text-gray-900 mb-1">
                                                    <MapPin className="w-3 h-3 text-blue-600" />
                                                    <span className="text-[10px] font-black uppercase tracking-tight">
                                                        {user.ipLogs?.[0]?.city || 'Unknown City'}, {user.ipLogs?.[0]?.country || 'Unknown'}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <Globe className="w-3 h-3" />
                                                            <span className="text-[9px] font-bold uppercase tracking-widest">{[...new Set(user.ipLogs?.map((l: any) => l.ip))].length} IPs</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-none border border-blue-100">
                                                            <Shield className="w-2.5 h-2.5" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest">{[...new Set(user.ipLogs?.filter((l: any) => l.deviceFingerprint).map((l: any) => l.deviceFingerprint))].length || 1} Devices</span>
                                                        </div>
                                                    </div>

                                                    {/* Alert if Multi-Country detected */}
                                                    {[...new Set(user.ipLogs?.filter((l: any) => l.country).map((l: any) => l.country))].length > 1 && (
                                                        <div className="mt-1 flex items-center gap-2 text-amber-600">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            <span className="text-[8px] font-bold uppercase tracking-widest">Multi-Country Access</span>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {[...new Set(user.ipLogs?.map((l: any) => l.ip))].slice(0, 3).map((ip: any) => (
                                                            <span key={ip} className="text-[8px] font-bold px-1.5 py-0.5 rounded-none bg-gray-50 border border-gray-100 text-gray-400 tabular-nums lowercase">
                                                                {ip}
                                                            </span>
                                                        ))}
                                                        {[...new Set(user.ipLogs?.map((l: any) => l.ip))].length > 3 && (
                                                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-none bg-gray-900 text-white uppercase tracking-widest">+{([...new Set(user.ipLogs?.map((l: any) => l.ip))].length - 3)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <Shield className={`w-4 h-4 ${user.role === 'ADMIN' ? 'text-blue-600' : 'text-gray-300'}`} />
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${user.role === 'ADMIN' ? 'text-blue-600' : 'text-gray-400'}`}>{user.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">{user.courses?.length || 0} Modules</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {user.courses?.slice(0, 2).map((course: any) => (
                                                        <span key={course.id} className="text-[7px] font-bold px-2 py-1 rounded-none bg-gray-50 border border-gray-100 text-gray-400 uppercase tracking-widest">
                                                            {course.title}
                                                        </span>
                                                    ))}
                                                    {user.courses?.length > 2 && (
                                                        <span className="text-[7px] font-bold px-2 py-1 rounded-none bg-gray-900 text-white uppercase tracking-widest">+{user.courses.length - 2}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2 text-gray-400 bg-gray-50 px-3 py-1.5 rounded-none border border-gray-100 w-fit">
                                                <Calendar className="w-3 h-3" />
                                                <span className="text-[9px] font-bold uppercase tracking-widest tabular-nums">
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
                        <div className="py-24 bg-gray-50 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-white border border-gray-100 rounded-none flex items-center justify-center mb-8 shadow-sm">
                                <Users className="w-6 h-6 text-gray-200" />
                            </div>
                            <h3 className="text-2xl font-bold uppercase tracking-tighter text-gray-900 mb-4">No Users Found</h3>
                            <p className="text-gray-400 text-xs max-w-sm font-medium">Students will appear here once they enroll in the curriculum.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
