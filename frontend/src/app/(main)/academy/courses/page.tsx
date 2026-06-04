'use client'

import { Suspense, useRef, useState, useEffect } from 'react'
import styles from './courses.module.css'
import CoursesList from './CoursesList'
import { CoursesGridSkeleton } from './Skeletons'
import Filter from './CourseFilter'
import { useApi } from '@/hooks/useApi'

export default function CoursesStreamingPage() {
    const topRef = useRef<HTMLDivElement>(null)
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
                    url: 'api/academy/courses/',
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
    }, [])

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

    const scrollToTop = () => {
        topRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        })
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