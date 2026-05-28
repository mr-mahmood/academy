'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useApi } from '@/hooks/useApi'
import type { Course } from '@/types/Course'
import styles from './AcademyDetails.module.css'
import { AcademyFilterSkeleton } from './AcademySkeletons'

interface FilterOption {
    id: number
    name: string
}

// Module-level cache to prevent multiple fetches
const coursesCache = new Map<string, Course[]>()
let pendingCoursesPromises = new Map<string, Promise<void>>()
// Shared cache for the list component
let lastDispatchedCourses: Course[] | null = null

export default function AcademyFilter({ academyId }: { academyId: string }) {
    const router = useRouter()
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const filterRef = useRef<HTMLDivElement>(null)
    const { apiFetch } = useApi() 
    const [selectedSport, setSelectedSport] = useState<string>('')
    const [selectedGender, setSelectedGender] = useState<string>('')
    const [sports, setSports] = useState<FilterOption[]>([])
    const [loading, setLoading] = useState(() => !coursesCache.has(academyId))
    const [allCourses, setAllCourses] = useState<Course[]>(() => {
        return coursesCache.get(academyId) || []
    })

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Listen for reset requests from the courses list
    useEffect(() => {
        const handleResetRequest = () => {
            clearFilters()
        }
        
        window.addEventListener('resetFilters', handleResetRequest)
        return () => window.removeEventListener('resetFilters', handleResetRequest)
    }, [allCourses]) // Add allCourses as dependency to ensure clearFilters has access to latest data

    // Helper to dispatch courses and update cache
    const dispatchCourses = (courses: Course[]) => {
        lastDispatchedCourses = courses
        window.dispatchEvent(new CustomEvent('academyCoursesChanged', { 
            detail: courses 
        }));
    }

    // Fetch courses (only once - cached)
    useEffect(() => {
        // If already cached, don't fetch
        if (coursesCache.has(academyId)) {
            setLoading(false)
            const cached = coursesCache.get(academyId)!
            setAllCourses(cached)
            
            // Extract sports from cached courses
            const uniqueSports = new Map()
            cached.forEach((course: Course) => {
                if (course.sport && !uniqueSports.has(course.sport.id)) {
                    uniqueSports.set(course.sport.id, {
                        id: course.sport.id,
                        name: course.sport.name
                    })
                }
            })
            setSports(Array.from(uniqueSports.values()))
            
            // Dispatch cached courses for list component
            dispatchCourses(cached)
            return
        }

        // If there's already a pending fetch for this academyId, wait for it
        if (pendingCoursesPromises.has(academyId)) {
            setLoading(true)
            pendingCoursesPromises.get(academyId)?.then(() => {
                const cached = coursesCache.get(academyId)
                if (cached) {
                    setAllCourses(cached)
                    setLoading(false)
                    
                    // Extract sports after cache loads
                    const uniqueSports = new Map()
                    cached.forEach((course: Course) => {
                        if (course.sport && !uniqueSports.has(course.sport.id)) {
                            uniqueSports.set(course.sport.id, {
                                id: course.sport.id,
                                name: course.sport.name
                            })
                        }
                    })
                    setSports(Array.from(uniqueSports.values()))
                    
                    // Dispatch cached courses
                    dispatchCourses(cached)
                }
            })
            return
        }

        // Start new fetch
        const fetchCourses = async () => {
            setLoading(true)
            
            const fetchPromise = (async () => {
                try {
                    const result = await apiFetch({
                        url: `api/courses/academies/${academyId}/`,
                        method: 'GET'
                    })

                    if (result.success) {
                        const coursesData = result.data?.courses || result.data || []
                        const coursesArray = Array.isArray(coursesData) ? coursesData : []
                        
                        // Store in cache
                        coursesCache.set(academyId, coursesArray)
                        setAllCourses(coursesArray)
                        
                        // Extract unique sports for filter
                        const uniqueSports = new Map()
                        coursesArray.forEach((course: Course) => {
                            if (course.sport && !uniqueSports.has(course.sport.id)) {
                                uniqueSports.set(course.sport.id, {
                                    id: course.sport.id,
                                    name: course.sport.name
                                })
                            }
                        })
                        setSports(Array.from(uniqueSports.values()))
                        
                        // Dispatch courses for list component
                        dispatchCourses(coursesArray)
                    }
                } catch (error) {
                    console.error('Error fetching courses:', error)
                } finally {
                    setLoading(false)
                    pendingCoursesPromises.delete(academyId)
                }
            })()

            pendingCoursesPromises.set(academyId, fetchPromise)
            await fetchPromise
        }

        if (academyId) {
            fetchCourses()
        }
    }, [academyId, router])

    const updateFilters = (type: string, value: string) => {
        let newSport = selectedSport;
        let newGender = selectedGender;
        
        if (type === 'sport') {
            newSport = value;
            setSelectedSport(value);
        }
        if (type === 'gender') {
            newGender = value;
            setSelectedGender(value);
        }
        
        // Apply filters
        let filteredResult = [...allCourses];

        if (newSport) {
            filteredResult = filteredResult.filter(course =>
                course.sport?.id === parseInt(newSport)
            )
        }
        if (newGender) {
            filteredResult = filteredResult.filter(course =>
                course.gender_requirement === newGender
            )
        }
        
        // Dispatch filtered courses
        dispatchCourses(filteredResult)
    }

    const clearFilters = () => {
        setSelectedSport('');
        setSelectedGender('');
        setIsFilterOpen(false);
        
        // Dispatch all courses (clear filters)
        dispatchCourses([...allCourses])
    }

    const hasActiveFilters = selectedSport || selectedGender

    // Show skeleton while loading
    if (loading) {
        return <AcademyFilterSkeleton />
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
                        {[selectedSport, selectedGender].filter(Boolean).length}
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
                        <label className={styles.filterLabel}>جنسیت</label>
                        <select
                            value={selectedGender}
                            onChange={(e) => updateFilters('gender', e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">همه جنسیت‌ها</option>
                            <option value="MALE">آقایان</option>
                            <option value="FEMALE">بانوان</option>
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