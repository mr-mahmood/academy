// app/academies/[id]/page.tsx
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import styles from './academyDetails.module.css'
import AcademyInfo from './AcademyInfo'
import AcademyCourseFilter from './AcademyCourseFilter'
import AcademyCoursesList from './AcademyCoursesList'
import { Icon, Icons } from '@/components/icon'
import { useApi } from '@/hooks/useApi'
import type { Course } from '@/types/Course'
import type { Academy } from '@/types/Academy'

export default function AcademyDetailsPage() {
    const params = useParams()
    const academyId = params.id as string
    const topRef = useRef<HTMLDivElement>(null)
    const { apiFetch } = useApi()
    const [activeTab, setActiveTab] = useState<'info' | 'map' | 'courses'>('info')
    const [loading, setLoading] = useState(true)
    const [academy, setAcademy] = useState<Academy | null>(null)
    const [coursesCount, setCoursesCount] = useState(0)
    const [originalCourses, setOriginalCourses] = useState<any[]>([])
    const [filteredCourses, setFilteredCourses] = useState<any[]>([])
    const [activeFilterCount, setActiveFilterCount] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [coursesFetched, setCoursesFetched] = useState(false)
    const [academyFetched, setAcademyFetched] = useState(false)

    // Fetch academy info only once
    useEffect(() => {
        if (!academyId || academyFetched) return

        const fetchAcademy = async () => {
            try {
                const academyResult = await apiFetch({
                    url: `api/academies/${academyId}/`,
                    method: 'GET',
                })
                
                let academyData: Academy | null = null
                if (academyResult.success && academyResult.data?.academy) {
                    academyData = academyResult.data.academy
                } else if (academyResult.success && academyResult.data) {
                    academyData = academyResult.data as Academy
                } else {
                    setError('ورزشگاه مورد نظر یافت نشد')
                }
                setAcademy(academyData)
                setAcademyFetched(true)
            } catch (error) {
                console.error('Error fetching academy:', error)
                setError('خطا در دریافت اطلاعات')
            }
        }

        const fetchCourses = async () => {
            setLoading(true)
            try {
                const coursesResult = await apiFetch({
                    url: `api/courses/academies/${academyId}/`,
                    method: 'GET'
                })

                if (coursesResult.success) {
                    const coursesData = coursesResult.data?.courses || coursesResult.data || []
                    const coursesArray = Array.isArray(coursesData) ? coursesData : []
                    setOriginalCourses(coursesArray)
                    setFilteredCourses(coursesArray)
                    setCoursesCount(coursesArray.length)
                    setCoursesFetched(true)
                }
            } catch (error) {
                console.error('Error fetching courses:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
        fetchAcademy()
    }, [academyId, apiFetch, academyFetched])

    const handleFilterChange = useCallback((newFilteredData: any[]) => {
        setFilteredCourses(newFilteredData)
    }, [])

    const handleTabChange = (tab: 'info' | 'map' | 'courses') => {
        setActiveTab(tab)
        if (tab === 'courses') {
            // Reset filters when switching to courses tab
            window.dispatchEvent(new CustomEvent('resetFilters'))
        }
    }

    // Don't show loading for info tab when only academy is loading
    const showLoading = activeTab === 'courses' ? loading : (activeTab === 'info' && !academyFetched)

    return (
        <>
            <div ref={topRef} />
            <div className={styles.container}>
                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'info' ? styles.activeTab : ''}`}
                        onClick={() => handleTabChange('info')}
                    >
                        <Icon icon={Icons.info} />
                        <span>اطلاعات</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'map' ? styles.activeTab : ''}`}
                        onClick={() => handleTabChange('map')}
                    >
                        <Icon icon={Icons.location} />
                        <span>نقشه</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'courses' ? styles.activeTab : ''}`}
                        onClick={() => handleTabChange('courses')}
                    >
                        <Icon icon={Icons.school} />
                        <span>دوره‌ها</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className={styles.tabContent}>
                    {activeTab === 'info' && (
                        <AcademyInfo
                            academy={academy}
                            coursesCount={coursesCount}
                            loading={!academyFetched}
                            error={error}
                        />
                    )}

                    {activeTab === 'courses' && (
                        <>
                            <AcademyCourseFilter
                                data={originalCourses}
                                onFilterChange={handleFilterChange}
                                onFilterCountChange={setActiveFilterCount}
                                loading={loading}
                            />
                            <AcademyCoursesList
                                courses={filteredCourses}
                                loading={loading}
                            />
                        </>
                    )}

                    {activeTab === 'map' && (
                        <div className={styles.mapTab}>
                            <div className={styles.mapPlaceholder}>
                                <Icon icon={Icons.location} />
                                <h3>نقشه</h3>
                                <p>این بخش به زودی فعال خواهد شد</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}