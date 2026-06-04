'use client'

import { useEffect, useState, useCallback } from 'react'
import { Icon, Icons } from '@/components/icon'
import FootballTestCard from '@/components/FootballTestCard/FootballTestCard'
import type { FootballEnrollment } from '@/types/FootballEnrollment'
import styles from './my-tests.module.css'
import { MyFootballTestsCardSkeleton } from './MyFootballTestsSkeletons'

interface MyFootballTestsListProps {
    enrollments?: FootballEnrollment[]
    isLoading?: boolean
}

export default function MyFootballTestsList({ enrollments = [], isLoading = false }: MyFootballTestsListProps) {
    const [filteredEnrollments, setFilteredEnrollments] = useState<FootballEnrollment[]>([])

    useEffect(() => {
        // Listen for filtered enrollments from filter component
        const handleFilteredEnrollments = (event: CustomEvent) => {
            const filteredTests = event.detail
            // Match filtered tests back to enrollments
            const matchedEnrollments = enrollments.filter(enrollment => 
                filteredTests.some((test: any) => test.id === enrollment.course.id)
            )
            setFilteredEnrollments(matchedEnrollments)
        }
        
        window.addEventListener('myFootballTestsFilteredChanged', handleFilteredEnrollments as EventListener)
        
        return () => {
            window.removeEventListener('myFootballTestsFilteredChanged', handleFilteredEnrollments as EventListener)
        }
    }, [enrollments])

    // Update filtered enrollments when enrollments change (initial load)
    useEffect(() => {
        if (enrollments.length > 0 && !isLoading) {
            setFilteredEnrollments(enrollments)
        }
    }, [enrollments, isLoading])

    // Function to reset filters
    const handleResetFilters = useCallback(() => {
        window.dispatchEvent(new CustomEvent('resetMyFootballTestsFilters'))
    }, [])

    // Show skeletons while loading
    if (isLoading) {
        return (
            <div className={styles.enrollmentsList}>
                {[1, 2, 3].map((i) => (
                    <MyFootballTestsCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    // No tests at all (user has no enrollments)
    if (enrollments.length === 0) {
        return (
            <div className={styles.emptyTests}>
                <Icon icon={Icons.football} />
                <p>شما هیچ تستی ثبت‌نام نشده‌اید</p>
            </div>
        )
    }

    // No results with filters applied
    if (filteredEnrollments.length === 0 && enrollments.length > 0) {
        return (
            <div className={styles.emptyTests}>
                <Icon icon={Icons.football} />
                <p>هیچ تستی با فیلترهای انتخاب شده وجود ندارد</p>
                <button 
                    onClick={handleResetFilters}
                    className={styles.resetFiltersButton}
                >
                    <span>حذف همه فیلترها</span>
                </button>
            </div>
        )
    }

    return (
        <div className={styles.enrollmentsList}>
            {filteredEnrollments.map((enrollment) => (
                <FootballTestCard
                    key={enrollment.id}
                    test={enrollment.course}
                    onClickUrl={`/football/courses/${enrollment.course.id}`}
                />
            ))}
        </div>
    )
}