'use client'

import { useState, useCallback } from 'react'
import styles from './my-tests.module.css'
import MyFootballTestsFilter from './MyFootballTestsFilter'
import MyFootballTestsList from './MyFootballTestsList'
import type { FootballEnrollment } from '@/types/FootballEnrollment'

export default function MyFootballTestsPage() {
    const [enrollments, setEnrollments] = useState<FootballEnrollment[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const handleEnrollmentsLoaded = useCallback((data: FootballEnrollment[]) => {
        setEnrollments(data)
        setIsLoading(false)
    }, [])

    return (
        <div className={styles.container}>
            <MyFootballTestsFilter 
                onEnrollmentsLoaded={handleEnrollmentsLoaded}
                isLoading={isLoading}
            />
            <MyFootballTestsList 
                enrollments={enrollments}
                isLoading={isLoading}
            />
        </div>
    )
}