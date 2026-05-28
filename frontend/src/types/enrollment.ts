// types/enrollment.ts
import { UserData } from './userData'
import { Course } from './Course'


export interface Enrollment {
    id: number
    user: UserData
    course: Course
    enrollment_status: 'WAITING_FOR_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
    enrolled_at: string
    updated_at: string
    cancelled_at: string | null
}

export interface EnrollmentsResponse {
    success: boolean
    message: string
    data: {
        enrollments: Enrollment[]
    }
}