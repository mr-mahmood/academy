import { FootballTest } from './FootballTest'
import { UserData } from './userData'

export interface FootballEnrollment {
    id: number
    user: UserData
    course: FootballTest
    enrollment_status: 'WAITING_FOR_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
    enrolled_at: string
    updated_at: string
    cancelled_at: string | null
}

export interface FootballEnrollmentResponse {
    success: boolean
    message: string
    enrollment?: FootballEnrollment
    enrollments?: FootballEnrollment[]
}