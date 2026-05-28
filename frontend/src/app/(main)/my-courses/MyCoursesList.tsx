'use client'

import { useEffect, useState } from 'react'
import { Icon, Icons } from '@/components/icon'
import ClassCard from '@/components/CourseCard/CourseCard'
import type { Enrollment } from '@/types/Enrollment'
import styles from './my-courses.module.css'
import { MyCoursesCardSkeleton } from './MyCoursesSkeletons'

export default function MyCoursesList() {
    const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([])
    const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Listen for filtered enrollments from filter component
        const handleFilteredEnrollments = (event: CustomEvent) => {
            setFilteredEnrollments(event.detail)
            setLoading(false)
        }
        
        // Listen for all enrollments to be loaded
        const handleAllEnrollments = (event: CustomEvent) => {
            setAllEnrollments(event.detail)
        }
        
        window.addEventListener('myCoursesFilteredChanged', handleFilteredEnrollments as EventListener);
        window.addEventListener('myCoursesAllEnrollmentsLoaded', handleAllEnrollments as EventListener);
        
        return () => {
            window.removeEventListener('myCoursesFilteredChanged', handleFilteredEnrollments as EventListener);
            window.removeEventListener('myCoursesAllEnrollmentsLoaded', handleAllEnrollments as EventListener);
        }
    }, []);

    // Function to reset filters
    const handleResetFilters = () => {
        window.dispatchEvent(new CustomEvent('resetMyCoursesFilters'));
    }

    // Show skeletons while loading
    if (loading) {
        return (
            <div className={styles.enrollmentsList}>
                {[1, 2, 3].map((i) => (
                    <MyCoursesCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    // No courses at all (user has no enrollments)
    if (allEnrollments.length === 0) {
        return (
            <div className={styles.emptyCourses}>
                <Icon icon={Icons.school} />
                <p>شما هیچ کلاسی ثبت‌نام نشده‌اید</p>
            </div>
        )
    }

    // No results with filters applied
    if (filteredEnrollments.length === 0 && allEnrollments.length > 0) {
        return (
            <div className={styles.emptyCourses}>
                <Icon icon={Icons.filter} />
                <p>هیچ کلاسی با فیلترهای انتخاب شده وجود ندارد</p>
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
                    showAddress={true}
                    showSessions={true}
                />
            ))}
        </div>
    )
}