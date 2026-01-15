
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { PlusCircle, Video, BookOpen } from "lucide-react";

export default function AdminDashboard() {
    const { data: session } = useSession();

    return (
        <div className="container py-10">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage your courses and content</p>
                </div>
                <Link href="/admin/create-course" className="btn btn-primary">
                    <PlusCircle className="w-5 h-5" />
                    Create Course
                </Link>
            </div>

            {/* Stats or Course List Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-full text-blue-400">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Total Courses</h3>
                            <p className="text-3xl font-bold">0</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card min-h-[300px] flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-white/5 rounded-full mb-4">
                    <BookOpen className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                    Get started by creating your first course and adding lectures to it.
                </p>
                <Link href="/admin/create-course" className="btn btn-glass">
                    Create First Course
                </Link>
            </div>
        </div>
    );
}
