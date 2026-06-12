export interface Academy {
    id: number
    name: string
    academy_type: 'INTERNAL' | 'PARTNER_BASE'
    address_text: string
    latitude: number | null
    longitude: number | null
    instructor_name: string | null
    instructor_phone: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}