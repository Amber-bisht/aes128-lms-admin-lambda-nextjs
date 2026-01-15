
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

export default function CreateCourse() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;

        try {
            let imageUrl = "";

            // 1. Upload Image if present
            if (file) {
                // Get Presigned URL
                const urlRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/upload-url`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filename: file.name,
                        contentType: file.type,
                        type: "course-image"
                    })
                });
                const { url, key } = await urlRes.json();

                // Upload to S3
                await fetch(url, {
                    method: "PUT",
                    body: file,
                    headers: { "Content-Type": file.type }
                });

                // Construct Public URL (Assuming public bucket or generic access)
                // For now, we store the Key or a mocked public URL
                imageUrl = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_PUBLIC}.s3.amazonaws.com/${key}`;
            }

            // 2. Create Course in Backend
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/courses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Add Auth Token here (from session)
                },
                body: JSON.stringify({ title, description, imageUrl })
            });

            if (res.ok) {
                const course = await res.json();
                router.push(`/admin/course/${course.id}`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to create course");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container py-10 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Create New Course</h1>

            <form onSubmit={handleSubmit} className="glass-card space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2">Course Title</label>
                    <input
                        name="title"
                        required
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="e.g. Advanced System Design"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                        name="description"
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 h-32 focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="Course details..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Cover Image</label>
                    <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            {file ? file.name : "Click to upload image"}
                        </p>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full"
                >
                    {loading ? "Creating..." : "Create Course"}
                </button>
            </form>
        </div>
    );
}
