
export interface Lecture {
    id: string;
    title: string;
    section: string | null;
    description: string | null;
    videoUrl: string | null;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface Course {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    price: number;
    active: boolean;
    lectures: Lecture[];
    purchased?: boolean;
    createdAt: string;
    updatedAt: string;
}
