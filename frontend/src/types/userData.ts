export interface UserData {
    id: number;
    phone_number: string;
    national_id: string;
    full_name: string;
    parent_full_name: string;
    parent_national_id: string;
    parent_relationship: 'MOTHER' | 'FATHER';
    gender: 'MALE' | 'FEMALE';
    birth_date?: string | null;
    state?: string;
    city?: string;
    address?: string;
    profile_image?: string | null;
    created_at: string;
    updated_at: string;
}

// Gender options for forms
export const GENDER_OPTIONS = [
    { value: 'MALE', label: 'مرد' },
    { value: 'FEMALE', label: 'زن' }
] as const;

// Gender to Farsi mapping
export const genderToFarsi: Record<string, string> = {
    'MALE': 'مرد',
    'FEMALE': 'زن',
};

// Helper function to get gender in Farsi
export const getGenderInFarsi = (gender: string | undefined): string => {
    if (!gender) return 'نامشخص';
    return genderToFarsi[gender] || 'نامشخص';
};