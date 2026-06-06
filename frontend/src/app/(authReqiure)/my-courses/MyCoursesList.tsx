// app/my-courses/MyCoursesList.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Icon, Icons } from '@/components/icon'
import ClassCard from '@/components/CourseCard/CourseCard'
import type { Enrollment } from '@/types/enrollment'
import styles from './my-courses.module.css'
import { MyCoursesCardSkeleton } from './MyCoursesSkeletons'

interface MyCoursesListProps {
    enrollments?: Enrollment[]
    isLoading?: boolean
}

export default function MyCoursesList({ enrollments = [], isLoading = false }: MyCoursesListProps) {
    const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([])

    useEffect(() => {
        // Listen for filtered enrollments from filter component
        const handleFilteredEnrollments = (event: CustomEvent) => {
            const filteredCourses = event.detail
            // Match filtered courses back to enrollments
            const matchedEnrollments = enrollments.filter(enrollment => 
                filteredCourses.some((course: any) => course.id === enrollment.course.id)
            )
            setFilteredEnrollments(matchedEnrollments)
        }
        
        window.addEventListener('myCoursesFilteredChanged', handleFilteredEnrollments as EventListener)
        
        return () => {
            window.removeEventListener('myCoursesFilteredChanged', handleFilteredEnrollments as EventListener)
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
        window.dispatchEvent(new CustomEvent('resetMyCoursesFilters'))
    }, [])

    // Show skeletons while loading - THIS PREVENTS THE FLASH
    if (isLoading) {
        return (
            <div className={styles.enrollmentsList}>
                {[1, 2, 3].map((i) => (
                    <MyCoursesCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    // No courses at all (user has no enrollments)
    if (enrollments.length === 0) {
        return (
            <div className={styles.emptyCourses}>
                <Icon icon={Icons.school} />
                <p>شما هیچ کلاسی ثبت‌نام نشده‌اید</p>
            </div>
        )
    }

    // No results with filters applied
    if (filteredEnrollments.length === 0 && enrollments.length > 0) {
        return (
            <div className={styles.emptyCourses}>
                <Icon icon={Icons.school} />
                <p>هیچ دوره‌ای با فیلترهای انتخاب شده وجود ندارد</p>
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
                <ClassCard
                    key={enrollment.id}
                    id={enrollment.course.id}
                    sport={enrollment.course.sport}
                    academy={enrollment.course.academy}
                    schedule={enrollment.course.schedule}
                    totalSessions={enrollment.course.total_sessions}
                    price={enrollment.course.price}
                    gender={enrollment.course.gender_requirement}
                    enrollmentStatus={enrollment.enrollment_status}
                    onClickUrl={`/academy/courses/${enrollment.id}`}
                    showAddress={true}
                    showSessions={true}
                />
            ))}
        </div>
    )
}