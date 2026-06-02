// app/academy-details/AcademyCoursesList.tsx
'use client'

import { Icon, Icons } from '@/components/icon'
import CourseCard from '@/components/CourseCard/CourseCard'
import type { Course } from '@/types/Course'
import styles from './academyDetails.module.css'
import { AcademyCoursesSkeleton } from './AcademySkeletons'

interface AcademyCoursesListProps {
    courses: Course[]
    loading?: boolean
}

export default function AcademyCoursesList({ courses, loading = false }: AcademyCoursesListProps) {
    // Function to reset filters
    const handleResetFilters = () => {
        // Dispatch event to reset filters in the Filter component
        window.dispatchEvent(new CustomEvent('resetFilters'));
    }

    // Show skeletons while loading
    if (loading) {
        return <AcademyCoursesSkeleton />
    }

    if (courses.length === 0) {
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
            {courses.map((course) => (
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