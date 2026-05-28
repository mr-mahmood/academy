import { Sport } from './Sport'
import { Academy } from './Academy'
import { Schedule } from './Schedule'


export interface Course {
    id: number
    sport: Sport 
    academy: Academy
    instructor_name: string | null
    total_sessions: number
    max_students: number
    enrolled_students: number
    available_seats: number
    price: string
    gender_requirement: 'MALE' | 'FEMALE'
    status: 'ACTIVE' | 'FULL' | 'CANCELLED' | 'COMPLETED'
    schedule: Schedule[]
    created_at: string
    updated_at: string
}
