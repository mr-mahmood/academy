'use client'

import { Suspense } from 'react'
import styles from './my-courses.module.css'
import MyCoursesFilter from './MyCoursesFilter'
import MyCoursesList from './MyCoursesList'
import { MyCoursesFilterSkeleton, MyCoursesGridSkeleton } from './MyCoursesSkeletons'

export default function MyCoursesPage() {
    return (
        <div className={styles.container}>
            {/* Filter Section - loads independently */}
            <Suspense fallback={<MyCoursesFilterSkeleton />}>
                <MyCoursesFilter />
            </Suspense>

            {/* Courses List - streams as they load */}
            <Suspense fallback={<MyCoursesGridSkeleton />}>
                <MyCoursesList />
            </Suspense>
        </div>
    )
}