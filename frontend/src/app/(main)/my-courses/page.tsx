// app/my-courses/page.tsx
'use client'

import { useState, useCallback } from 'react'
import styles from './my-courses.module.css'
import MyCoursesFilter from './MyCoursesFilter'
import MyCoursesList from './MyCoursesList'
import type { Enrollment } from '@/types/enrollment'

export default function MyCoursesPage() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const handleEnrollmentsLoaded = useCallback((data: Enrollment[]) => {
        setEnrollments(data)
        setIsLoading(false)
    }, [])

    return (
        <div className={styles.container}>
            <MyCoursesFilter 
                onEnrollmentsLoaded={handleEnrollmentsLoaded}
                isLoading={isLoading}
            />
            <MyCoursesList 
                enrollments={enrollments}
                isLoading={isLoading}
            />
        </div>
    )
}