
export interface VideoAsset {
    id: string;
    name: string | null;
    videoUrl: string;
    encryptionKey: string | null;
    iv: string | null;
    createdAt: string;
}

export interface Lecture {
    id: string;
    title: string;
    section: string | null;
    description: string | null;
    videoUrl: string | null;
    imageUrl: string | null;
    videoAssetId: string | null;
    videoAsset?: VideoAsset | null;
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
