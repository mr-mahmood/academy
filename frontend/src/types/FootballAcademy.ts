export interface FootballAcademy {
    id: number
    name: string
    city: 'ISFAHAN' | 'GORGAN' | 'RAMHORMOZ' | 'KERMAN' | 'KERMANSHAH' | 'BABOL' | 'GILAN' | 'DOROUD'
    city_display: string
    address_text: string | null
    latitude: number | null
    longitude: number | null
    phone: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}