'use client'

import { Suspense } from 'react'
import styles from './courses.module.css'
import CoursesFilter from './CoursesFilter'
import CoursesList from './CoursesList'
import { FilterSkeleton, CoursesGridSkeleton } from './Skeletons'

export default function CoursesStreamingPage() {
    return (
        <div className={styles.container}>
            {/* Filter Section - loads independently */}
            <Suspense fallback={<FilterSkeleton />}>
                <CoursesFilter />
            </Suspense>

            {/* Courses List - streams as they load */}
            <Suspense fallback={<CoursesGridSkeleton />}>
                <CoursesList />
            </Suspense>
        </div>
    )
}