'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useApi } from '@/hooks/useApi'
import type { Enrollment } from '@/types/Enrollment'
import styles from './my-courses.module.css'
import { MyCoursesFilterSkeleton } from './MyCoursesSkeletons'

interface FilterOption {
    id: number
    name: string
}

interface MyCoursesFilterProps {
    onEnrollmentsLoaded?: (enrollments: Enrollment[]) => void
}

export default function MyCoursesFilter({ onEnrollmentsLoaded }: MyCoursesFilterProps) {
    const router = useRouter()
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const filterRef = useRef<HTMLDivElement>(null)
    const { apiFetch } = useApi() 
    const [selectedSport, setSelectedSport] = useState<string>('')
    const [selectedAcademy, setSelectedAcademy] = useState<string>('')
    const [sports, setSports] = useState<FilterOption[]>([])
    const [academies, setAcademies] = useState<FilterOption[]>([])
    const [loading, setLoading] = useState(true)
    const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Fetch enrollments (only once)
    useEffect(() => {
        const fetchEnrollments = async () => {
            setLoading(true)
            try {
                const result = await apiFetch({
                    url: 'api/registrations/',
                    method: 'GET'
                })

                if (result.success) {
                    let enrollmentsData: Enrollment[] = []
                    if (result.data?.enrollments) {
                        enrollmentsData = result.data.enrollments
                    } else if (result.data?.registrations) {
                        enrollmentsData = result.data.registrations
                    }

                    setAllEnrollments(enrollmentsData)

                    // Pass enrollments to parent component
                    if (onEnrollmentsLoaded) {
                        onEnrollmentsLoaded(enrollmentsData)
                    }

                    // 🔥 IMPORTANT: Dispatch initial enrollments (all enrollments, no filters)
                    window.dispatchEvent(new CustomEvent('myCoursesFilteredChanged', {
                        detail: enrollmentsData
                    }));

                    // 🔥 Dispatch all enrollments for the list component to track
                    window.dispatchEvent(new CustomEvent('myCoursesAllEnrollmentsLoaded', {
                        detail: enrollmentsData
                    }));

                    // Extract filter options
                    const uniqueSports = new Map()
                    const uniqueAcademies = new Map()

                    enrollmentsData.forEach((enrollment: Enrollment) => {
                        if (enrollment.course?.sport && !uniqueSports.has(enrollment.course.sport.id)) {
                            uniqueSports.set(enrollment.course.sport.id, {
                                id: enrollment.course.sport.id,
                                name: enrollment.course.sport.name
                            })
                        }
                        if (enrollment.course?.academy && !uniqueAcademies.has(enrollment.course.academy.id)) {
                            uniqueAcademies.set(enrollment.course.academy.id, {
                                id: enrollment.course.academy.id,
                                name: enrollment.course.academy.name
                            })
                        }
                    })

                    setSports(Array.from(uniqueSports.values()))
                    setAcademies(Array.from(uniqueAcademies.values()))
                }
            } catch (error) {
                console.error('Error fetching enrollments:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchEnrollments()
    }, [router, onEnrollmentsLoaded])

    // Listen for reset requests from the courses list
    useEffect(() => {
        const handleResetRequest = () => {
            clearFilters()
        }

        window.addEventListener('resetMyCoursesFilters', handleResetRequest)
        return () => window.removeEventListener('resetMyCoursesFilters', handleResetRequest)
    }, [allEnrollments])

    const updateFilters = (type: string, value: string) => {
        let newSport = selectedSport;
        let newAcademy = selectedAcademy;

        if (type === 'sport') {
            newSport = value;
            setSelectedSport(value);
        }
        if (type === 'academy') {
            newAcademy = value;
            setSelectedAcademy(value);
        }

        // Apply filters
        let filteredResult = [...allEnrollments];

        if (newSport) {
            filteredResult = filteredResult.filter(enrollment =>
                enrollment.course?.sport?.id === parseInt(newSport)
            )
        }
        if (newAcademy) {
            filteredResult = filteredResult.filter(enrollment =>
                enrollment.course?.academy?.id === parseInt(newAcademy)
            )
        }

        // Dispatch event with filtered enrollments
        window.dispatchEvent(new CustomEvent('myCoursesFilteredChanged', {
            detail: filteredResult
        }));
    }

    const clearFilters = () => {
        setSelectedSport('');
        setSelectedAcademy('');
        setIsFilterOpen(false);

        // Dispatch all enrollments (clear filters)
        window.dispatchEvent(new CustomEvent('myCoursesFilteredChanged', {
            detail: [...allEnrollments]
        }));
    }

    const hasActiveFilters = selectedSport || selectedAcademy

    // Show skeleton while loading
    if (loading) {
        return <MyCoursesFilterSkeleton />
    }

    return (
        <div className={styles.filterSection} ref={filterRef}>
            <button
                className={`${styles.filterButton} ${hasActiveFilters ? styles.filterButtonActive : ''}`}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
                <Icon icon={Icons.filter} />
                <span>فیلترها</span>
                {hasActiveFilters && (
                    <span className={styles.filterBadge}>
                        {[selectedSport, selectedAcademy].filter(Boolean).length}
                    </span>
                )}
                <Icon icon={isFilterOpen ? Icons.chevronUp : Icons.chevronDown} className={styles.chevron} />
            </button>

            {isFilterOpen && (
                <div className={styles.filterDropdown}>
                    <div className={styles.filterRow}>
                        <label className={styles.filterLabel}>ورزش</label>
                        <select
                            value={selectedSport}
                            onChange={(e) => updateFilters('sport', e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">همه ورزش‌ها</option>
                            {sports.map(sport => (
                                <option key={sport.id} value={sport.id}>
                                    {sport.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterRow}>
                        <label className={styles.filterLabel}>ورزشگاه</label>
                        <select
                            value={selectedAcademy}
                            onChange={(e) => updateFilters('academy', e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">همه ورزشگاه‌ها</option>
                            {academies.map(academy => (
                                <option key={academy.id} value={academy.id}>
                                    {academy.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {hasActiveFilters && (
                        <button onClick={clearFilters} className={styles.clearFiltersBtn}>
                            <Icon icon={Icons.times} />
                            <span>حذف همه فیلترها</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}