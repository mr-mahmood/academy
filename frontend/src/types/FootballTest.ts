import { FootballAcademy } from './FootballAcademy'

export interface FootballTest {
    id: number
    academy: FootballAcademy
    coache: string
    position: 'GK' | 'CB' | 'LB' | 'RB' | 'CM' | 'RW' | 'LW' | 'ST'
    position_display: string
    gender_requirement: 'MALE' | 'FEMALE'
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