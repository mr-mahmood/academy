'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useApi } from '@/hooks/useApi'
import type { Academy } from '@/types/Academy'
import styles from './AcademyDetails.module.css'
import { AcademyInfoSkeleton } from './AcademySkeletons'

// Module-level cache to prevent multiple fetches
const academyCache = new Map<string, { academy: Academy | null; coursesCount: number }>()
let pendingPromises = new Map<string, Promise<void>>()

export default function AcademyInfo({ academyId }: { academyId: string }) {
    const router = useRouter()
    const [academy, setAcademy] = useState<Academy | null>(() => {
        // Initialize from cache if available
        const cached = academyCache.get(academyId)
        return cached?.academy || null
    })
    const [coursesCount, setCoursesCount] = useState(() => {
        const cached = academyCache.get(academyId)
        return cached?.coursesCount || 0
    })
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(() => !academyCache.has(academyId))
    const { apiFetch } = useApi() 

    useEffect(() => {
        // If already cached, don't fetch
        if (academyCache.has(academyId)) {
            setLoading(false)
            return
        }

        // If there's already a pending fetch for this academyId, wait for it
        if (pendingPromises.has(academyId)) {
            setLoading(true)
            pendingPromises.get(academyId)?.then(() => {
                const cached = academyCache.get(academyId)
                if (cached) {
                    setAcademy(cached.academy)
                    setCoursesCount(cached.coursesCount)
                    setLoading(false)
                }
            })
            return
        }

        // Start new fetch
        const fetchData = async () => {
            setLoading(true)
            
            const fetchPromise = (async () => {
                try {
                    // Fetch academy info
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

                    // Fetch courses count
                    let count = 0
                    const coursesResult = await apiFetch({
                        url: `api/courses/academies/${academyId}/`,
                        method: 'GET',
                    })
                    if (coursesResult.success) {
                        const coursesData = coursesResult.data?.courses || coursesResult.data || []
                        count = Array.isArray(coursesData) ? coursesData.length : 0
                    }

                    // Store in cache
                    academyCache.set(academyId, {
                        academy: academyData,
                        coursesCount: count
                    })

                    setAcademy(academyData)
                    setCoursesCount(count)
                } catch (error) {
                    console.error('Error fetching academy:', error)
                    setError('خطا در دریافت اطلاعات ورزشگاه')
                } finally {
                    setLoading(false)
                    pendingPromises.delete(academyId)
                }
            })()

            pendingPromises.set(academyId, fetchPromise)
            await fetchPromise
        }

        fetchData()
    }, [academyId, router])

    if (loading) {
        return <AcademyInfoSkeleton />
    }

    if (error || !academy) {
        return (
            <div className={styles.errorBox}>
                <div className={styles.errorIcon}>
                    <Icon icon={Icons.timesCircle} />
                </div>
                <div>
                    <h3>خطا</h3>
                    <p>{error || 'ورزشگاه مورد نظر یافت نشد'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.infoTab}>
            <div className={styles.infoCard}>
                <h3>اطلاعات ورزشگاه</h3>
                <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>نام ورزشگاه</span>
                        <span className={styles.infoValue}>{academy.name}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>آدرس</span>
                        <span className={styles.infoValue}>{academy.address_text || '---'}</span>
                    </div>
                    {academy.phone && (
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>تلفن</span>
                            <span className={styles.infoValue} dir="ltr">{academy.phone}</span>
                        </div>
                    )}
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>تعداد دوره‌ها</span>
                        <span className={styles.infoValue}>{coursesCount}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}