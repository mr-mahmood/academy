'use client'

import { useRef, useState, useEffect, useCallback, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import styles from './academyDetails.module.css'
import AcademyInfo from './AcademyInfo'
import AcademyCourseFilter from './AcademyCourseFilter'
import AcademyCoursesList from './AcademyCoursesList'
import { Icon, Icons } from '@/components/icon'
import { useApi } from '@/hooks/useApi'
import type { Course } from '@/types/Course'
import type { Academy } from '@/types/Academy'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

function AcademyDetailsContent() {
    const params = useParams()
    const searchParams = useSearchParams()
    const academyId = params.id as string
    const academyType = searchParams.get('academy_type') || 'INTERNAL'
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

    const isInternal = academyType === 'INTERNAL'
    const typeLabel = isInternal ? 'ورزشگاه' : 'پایگاه'
    const errorMessage = isInternal ? 'ورزشگاه مورد نظر یافت نشد' : 'پایگاه مورد نظر یافت نشد'

    useEffect(() => {
        if (!academyId) return

        const fetchData = async () => {
            setLoading(true)
            setError(null)

            try {
                // Fetch academy info
                const academyResult = await apiFetch({
                    url: `api/academy/academies/${academyId}/?academy_type=${academyType}`,
                    method: 'GET',
                })
                
                let academyData: Academy | null = null
                if (academyResult.success && academyResult.data?.academy) {
                    academyData = academyResult.data.academy
                } else if (academyResult.success && academyResult.data) {
                    academyData = academyResult.data as Academy
                } else {
                    setError(errorMessage)
                }
                setAcademy(academyData)

                // Fetch courses
                const coursesResult = await apiFetch({
                    url: `api/academy/courses/academies/${academyId}/?academy_type=${academyType}`,
                    method: 'GET'
                })

                if (coursesResult.success) {
                    const coursesData = coursesResult.data?.courses || coursesResult.data || []
                    const coursesArray = Array.isArray(coursesData) ? coursesData : []
                    setOriginalCourses(coursesArray)
                    setFilteredCourses(coursesArray)
                    setCoursesCount(coursesArray.length)
                }
            } catch (error) {
                console.error('Error fetching data:', error)
                setError('خطا در دریافت اطلاعات')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [academyId])

    const handleFilterChange = useCallback((newFilteredData: any[]) => {
        setFilteredCourses(newFilteredData)
    }, [])

    const handleTabChange = (tab: 'info' | 'map' | 'courses') => {
        setActiveTab(tab)
        if (tab === 'courses') {
            window.dispatchEvent(new CustomEvent('resetFilters'))
        }
    }

    if (loading) {
        return <LoadingSpinner />
    }

    if (error || !academy) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorBox}>
                    <Icon icon={Icons.timesCircle} />
                    <div>
                        <h3>خطا</h3>
                        <p>{error || errorMessage}</p>
                    </div>
                    <button onClick={() => window.history.back()}>بازگشت</button>
                </div>
            </div>
        )
    }

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
                            academyType={academyType}
                            loading={false}
                            error={null}
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

export default function AcademyDetailsPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AcademyDetailsContent />
        </Suspense>
    )
}