'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from './courses.module.css'
import CoursesList from './CoursesList'
import Filter from './CourseFilter'
import { useApi } from '@/hooks/useApi'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

function CoursesContent() {
    const topRef = useRef<HTMLDivElement>(null)
    const searchParams = useSearchParams()
    const academyType = searchParams.get('academy_type') || 'INTERNAL'
    const { apiFetch } = useApi()
    const [loading, setLoading] = useState(true)
    const [originalCourses, setOriginalCourses] = useState<any[]>([])
    const [filteredCourses, setFilteredCourses] = useState<any[]>([])
    const [activeFilterCount, setActiveFilterCount] = useState(0)

    // Fetch courses when page loads
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true)
            try {
                const result = await apiFetch({
                    url: `api/academy/courses/?academy_type=${academyType}`,
                    method: 'GET'
                })

                if (result.success) {
                    const courses = result.data?.courses || result.data || []
                    setOriginalCourses(courses)
                    setFilteredCourses(courses)
                }
            } catch (error) {
                console.error('Error fetching courses:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
    }, [academyType])

    useEffect(() => {
        const handleFilterCount = (e: CustomEvent) => {
            setActiveFilterCount(e.detail)
        }
        window.addEventListener('filterCountChanged', handleFilterCount as EventListener)
        return () => window.removeEventListener('filterCountChanged', handleFilterCount as EventListener)
    }, [])

    const handleFilterChange = (newFilteredData: any[]) => {
        setFilteredCourses(newFilteredData)
    }

    return (
        <>
            <div ref={topRef} />
            <div className={styles.container}>
                <Filter
                    data={originalCourses}
                    onFilterChange={handleFilterChange}
                    onFilterCountChange={setActiveFilterCount}
                    loading={loading}
                />

                <CoursesList
                    courses={filteredCourses}
                    loading={loading}
                />
            </div>
        </>
    )
}

export default function CoursesStreamingPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <CoursesContent />
        </Suspense>
    )
}