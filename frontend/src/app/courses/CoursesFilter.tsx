'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useApi } from '@/hooks/useApi'
import type { Course } from '@/types/Course'
import styles from './courses.module.css'
import { FilterSkeleton } from './Skeletons'

interface FilterOption {
    id: number
    name: string
}

interface CoursesFilterProps {
    onCoursesLoaded?: (courses: Course[]) => void
}

export default function CoursesFilter({ onCoursesLoaded }: CoursesFilterProps) {
    const router = useRouter()
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const filterRef = useRef<HTMLDivElement>(null)
    const { apiFetch } = useApi() 
    const [selectedSport, setSelectedSport] = useState<string>('')
    const [selectedAcademy, setSelectedAcademy] = useState<string>('')
    const [selectedGender, setSelectedGender] = useState<string>('')
    const [sports, setSports] = useState<FilterOption[]>([])
    const [academies, setAcademies] = useState<FilterOption[]>([])
    const [loading, setLoading] = useState(true)
    const [allCourses, setAllCourses] = useState<Course[]>([])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Fetch courses (only once)
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true)
            try {
                const result = await apiFetch({
                    url: 'api/courses/',
                    method: 'GET'
                })

                if (result.success) {
                    const coursesData = result.data?.courses || result.data || []
                    const coursesArray = Array.isArray(coursesData) ? coursesData : []
                    setAllCourses(coursesArray)
                    
                    // Pass courses to parent component
                    if (onCoursesLoaded) {
                        onCoursesLoaded(coursesArray)
                    }
                    
                    // 🔥 IMPORTANT: Dispatch initial courses (all courses, no filters)
                    window.dispatchEvent(new CustomEvent('filteredCoursesChanged', { 
                        detail: coursesArray 
                    }));
                    
                    // Extract filter options
                    const uniqueSports = new Map()
                    const uniqueAcademies = new Map()
                    
                    coursesArray.forEach((course: Course) => {
                        if (course.sport && !uniqueSports.has(course.sport.id)) {
                            uniqueSports.set(course.sport.id, {
                                id: course.sport.id,
                                name: course.sport.name
                            })
                        }
                        if (course.academy && !uniqueAcademies.has(course.academy.id)) {
                            uniqueAcademies.set(course.academy.id, {
                                id: course.academy.id,
                                name: course.academy.name
                            })
                        }
                    })
                    
                    setSports(Array.from(uniqueSports.values()))
                    setAcademies(Array.from(uniqueAcademies.values()))
                }
            } catch (error) {
                console.error('Error fetching courses:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
    }, [router, onCoursesLoaded])

    // Listen for reset requests from the courses list
    useEffect(() => {
        const handleResetRequest = () => {
            clearFilters()
        }
        
        window.addEventListener('resetFilters', handleResetRequest)
        return () => window.removeEventListener('resetFilters', handleResetRequest)
    }, [allCourses]) // Add allCourses as dependency to ensure clearFilters has access to latest data

    const updateFilters = (type: string, value: string) => {
        let newSport = selectedSport;
        let newAcademy = selectedAcademy;
        let newGender = selectedGender;
        
        if (type === 'sport') {
            newSport = value;
            setSelectedSport(value);
        }
        if (type === 'academy') {
            newAcademy = value;
            setSelectedAcademy(value);
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
        if (newAcademy) {
            filteredResult = filteredResult.filter(course =>
                course.academy?.id === parseInt(newAcademy)
            )
        }
        if (newGender) {
            filteredResult = filteredResult.filter(course =>
                course.gender_requirement === newGender
            )
        }
        
        // Dispatch event with filtered courses
        window.dispatchEvent(new CustomEvent('filteredCoursesChanged', { 
            detail: filteredResult 
        }));
    }

    const clearFilters = () => {
        setSelectedSport('');
        setSelectedAcademy('');
        setSelectedGender('');
        setIsFilterOpen(false);
        
        // Dispatch all courses (clear filters)
        window.dispatchEvent(new CustomEvent('filteredCoursesChanged', { 
            detail: [...allCourses] 
        }));
    }

    const hasActiveFilters = selectedSport || selectedAcademy || selectedGender

    // Show skeleton while loading
    if (loading) {
        return <FilterSkeleton />
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
                        {[selectedSport, selectedAcademy, selectedGender].filter(Boolean).length}
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