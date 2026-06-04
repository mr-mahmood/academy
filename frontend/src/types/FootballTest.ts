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

export interface FootballTest {
    id: number
    academy: FootballAcademy
    coache: string
    age_category: 'U12' | 'U13' | 'U14' | 'U15' | 'U17' | 'U18' | 'YOUTH' | 'U21'
    gender_requirement: 'MALE' | 'FEMALE'
    position: 'GK' | 'CB' | 'LB' | 'RB' | 'CM' | 'RW' | 'LW' | 'ST'
    position_display: string
    test_date: string
    start_time: string
    end_time: string
    max_participants: number
    current_participants: number
    price: string | number
    status: 'ACTIVE' | 'FULL' | 'CANCELLED' | 'COMPLETED'
    created_at: string
    updated_at: string
}

export interface FootballTestsResponse {
    success: boolean
    message: string
    data: {
        courses: FootballTest[]
    }
}