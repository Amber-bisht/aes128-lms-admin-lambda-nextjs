import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://lms.amberbisht.me';

    // Static routes
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/courses`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
    ];

    // Dynamic routes (fetched from API)
    let courseRoutes: MetadataRoute.Sitemap = [];
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
            cache: 'no-store'
        });
        if (res.ok) {
            const courses = await res.json();
            courseRoutes = courses.map((course: any) => ({
                url: `${baseUrl}/${course.slug}`,
                lastModified: new Date(course.updatedAt || new Date()),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            }));
        }
    } catch (err) {
        console.error("Sitemap fetch error:", err);
    }

    return [...staticRoutes, ...courseRoutes];
}
