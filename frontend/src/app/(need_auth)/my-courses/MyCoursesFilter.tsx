// app/my-courses/MyCoursesFilter.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import styles from './my-courses.module.css'
import FilterModal from '@/components/FilterModal/FilterModal'
import { Icon, Icons } from '@/components/icon'
import { MyCoursesFilterSkeleton } from './MyCoursesSkeletons'
import type { Enrollment } from '@/types/enrollment'
import { useApi } from '@/hooks/useApi'

interface MyCoursesFilterProps {
    onEnrollmentsLoaded?: (enrollments: Enrollment[]) => void
    onFilterChange?: (filteredData: any[]) => void
    onFilterCountChange?: (count: number) => void
    isLoading?: boolean
}

export default function MyCoursesFilter({ onEnrollmentsLoaded, onFilterChange, onFilterCountChange, isLoading = false }: MyCoursesFilterProps) {
    const filterRef = useRef<HTMLDivElement>(null)
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [activeFilterCount, setActiveFilterCount] = useState(0)
    const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([])
    const { apiFetch } = useApi()
    const [fetched, setFetched] = useState(false)

    // Fetch enrollments when component mounts - ONLY ONCE
    useEffect(() => {
        if (fetched) return

        const fetchEnrollments = async () => {
            try {
                const result = await apiFetch({
                    url: 'api/academy/enrollment/',
                    method: 'GET'
                })

                if (result.success) {
                    let enrollmentsData: Enrollment[] = []
                    if (result.data?.enrollments) {
                        enrollmentsData = result.data.enrollments
                    }

                    setAllEnrollments(enrollmentsData)
                    setFetched(true)

                    if (onEnrollmentsLoaded) {
                        onEnrollmentsLoaded(enrollmentsData)
                    }

                    // Dispatch initial courses (all enrollments, no filters)
                    const initialCourses = enrollmentsData.map(enrollment => ({
                        ...enrollment.course,
                        enrollment_status: enrollment.enrollment_status
                    }))
                    
                    window.dispatchEvent(new CustomEvent('myCoursesFilteredChanged', {
                        detail: initialCourses
                    }))
                }
            } catch (error) {
                console.error('Error fetching enrollments:', error)
                // Still need to notify that loading is done even on error
                if (onEnrollmentsLoaded) {
                    onEnrollmentsLoaded([])
                }
            }
        }

        fetchEnrollments()
    }, [apiFetch, onEnrollmentsLoaded, fetched])

    // Listen for filter count changes
    useEffect(() => {
        const handleFilterCount = (e: CustomEvent) => {
            setActiveFilterCount(e.detail)
            if (onFilterCountChange) {
                onFilterCountChange(e.detail)
            }
        }
        
        window.addEventListener('filterCountChanged', handleFilterCount as EventListener)
        return () => window.removeEventListener('filterCountChanged', handleFilterCount as EventListener)
    }, [onFilterCountChange])

    // Show skeleton while loading
    if (isLoading) {
        return <MyCoursesFilterSkeleton />
    }

    return (
        <>
            {/* Filter Section */}
            <div className={styles.filterSection}>
                <button 
                    onClick={() => setIsFilterModalOpen(true)}
                    className={`${styles.filterButton} ${activeFilterCount > 0 ? styles.filterButtonActive : ''}`}
                >
                    <Icon icon={Icons.filter} />
                    <span>فیلترها</span>
                    {activeFilterCount > 0 && (
                        <span className={styles.filterBadge}>{activeFilterCount}</span>
                    )}
                    <Icon icon={Icons.chevronDown} className={styles.chevron} />
                </button>
            </div>
            
            <div ref={filterRef}>
                <FilterModal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    title="فیلتر دوره‌های من"
                    data={allEnrollments.map(enrollment => ({
                        ...enrollment.course,
                        enrollment_status: enrollment.enrollment_status
                    }))}
                    filterFields={[
                        {
                            key: 'sport',
                            label: 'ورزش',
                            type: 'select',
                            extractFrom: (item) => item.sport
                        },
                        {
                            key: 'academy',
                            label: 'ورزشگاه',
                            type: 'select',
                            extractFrom: (item) => item.academy
                        }
                    ]}
                    onFilterApply={onFilterChange}
                    onFilterCountChange={setActiveFilterCount}
                    filterChangeEvent="myCoursesFilteredChanged"
                    resetEvent="resetMyCoursesFilters"
                />
            </div>
        </>
    )
}