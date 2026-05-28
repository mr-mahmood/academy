'use client'

import { useEffect, useState } from 'react'
import { Icon, Icons } from '@/components/icon'
import CourseCard from '@/components/CourseCard/CourseCard'
import type { Course } from '@/types/Course'
import styles from './courses.module.css'
import { CourseCardSkeleton } from './Skeletons'

export default function CoursesList() {
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Listen for filtered courses from filter component
        const handleFilteredCourses = (event: CustomEvent) => {
            setFilteredCourses(event.detail)
            setLoading(false)
        }
        
        window.addEventListener('filteredCoursesChanged', handleFilteredCourses as EventListener);
        
        return () => window.removeEventListener('filteredCoursesChanged', handleFilteredCourses as EventListener);
    }, []);

    // Function to reset filters
    const handleResetFilters = () => {
        // Dispatch event to reset filters in the AcademyFilter component
        window.dispatchEvent(new CustomEvent('resetFilters'));
    }

    // Show skeletons while loading
    if (loading) {
        return (
            <div className={styles.coursesList}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <CourseCardSkeleton key={i} />
                ))}
            </div>
        )
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