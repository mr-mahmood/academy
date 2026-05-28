'use client'

import { useEffect, useState } from 'react'
import { Icon, Icons } from '@/components/icon'
import CourseCard from '@/components/CourseCard/CourseCard'
import type { Course } from '@/types/Course'
import styles from './AcademyDetails.module.css'
import { AcademyCoursesSkeleton } from './AcademySkeletons'

// Module-level cache to store last dispatched courses
let lastDispatchedCourses: Course[] | null = null

export default function AcademyCoursesList() {
    const [filteredCourses, setFilteredCourses] = useState<Course[]>(() => {
        // Initialize from cache if available
        return lastDispatchedCourses || []
    })
    const [loading, setLoading] = useState(() => !lastDispatchedCourses)

    useEffect(() => {
        // Listen for filtered courses from filter component
        const handleCoursesChanged = (event: CustomEvent) => {
            const courses = event.detail
            lastDispatchedCourses = courses // Store in cache
            setFilteredCourses(courses)
            setLoading(false)
        }
        
        window.addEventListener('academyCoursesChanged', handleCoursesChanged as EventListener);
        
        return () => window.removeEventListener('academyCoursesChanged', handleCoursesChanged as EventListener);
    }, []);

    // Function to reset filters
    const handleResetFilters = () => {
        // Dispatch event to reset filters in the AcademyFilter component
        window.dispatchEvent(new CustomEvent('resetFilters'));
    }

    // Show skeletons while loading
    if (loading) {
        return <AcademyCoursesSkeleton />
    }

    if (filteredCourses.length === 0) {
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
        <div className={styles.coursesList}>
            {filteredCourses.map((course) => (
                <CourseCard
                    key={course.id}
                    id={course.id}
                    sport={course.sport}
                    academy={course.academy}
                    schedule={course.schedule}
                    totalSessions={course.total_sessions}
                    price={course.price}
                    gender={course.gender_requirement}
                    status={course.status}
                    showAddress={true}
                    showSessions={true}
                />
            ))}
        </div>
    )
}