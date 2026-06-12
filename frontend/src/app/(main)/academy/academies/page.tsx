'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useApi } from '@/hooks/useApi'
import type { Academy } from '@/types/Academy'
import styles from './academies.module.css'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

export default function AcademiesListPage() {
    const router = useRouter()
    const [academies, setAcademies] = useState<Academy[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { apiFetch } = useApi()

    useEffect(() => {
        const fetchAcademies = async () => {
            setLoading(true)
            setError(null)

            try {
                const result = await apiFetch({
                    url: 'api/academy/academies/',
                    method: 'GET'
                })

                if (result.success && result.data?.academies) {
                    // Filter for INTERNAL academies only
                    const internalAcademies = result.data.academies.filter(
                        (academy: Academy) => academy.academy_type === 'INTERNAL'
                    )
                    setAcademies(internalAcademies)
                } else if (result.success && Array.isArray(result.data)) {
                    // Filter for INTERNAL academies only
                    const internalAcademies = result.data.filter(
                        (academy: Academy) => academy.academy_type === 'INTERNAL'
                    )
                    setAcademies(internalAcademies)
                }
            } catch (error) {
                console.error('Error fetching academies:', error)
                setError('خطا در دریافت اطلاعات ورزشگاه‌ها')
            } finally {
                setLoading(false)
            }
        }

        fetchAcademies()
    }, [router])

    if (loading) {
        return <LoadingSpinner />
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorBox}>
                    <Icon icon={Icons.timesCircle} />
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>تلاش مجدد</button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>

            {/* Explanation Box */}
            <div className={styles.explanationBox}>
                <Icon icon={Icons.handshake} className={styles.explanationIcon} />
                <div className={styles.explanationContent}>
                    <h4>ورزشگاه‌های داخلی چیست؟</h4>
                    <p>
                        ورزشگاه‌های داخلی، مجموعه‌های ورزشی هستند که به صورت مستقیم توسط مجموعه ما مدیریت می‌شوند.
                        این ورزشگاه‌ها امکانات کامل و استانداردهای لازم برای برگزاری دوره‌های آموزشی را دارا می‌باشند.
                    </p>
                </div>
            </div>

            {academies.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Icon icon={Icons.building} />
                    </div>
                    <h3>ورزشگاه داخلی یافت نشد</h3>
                    <p>در حال حاضر ورزشگاه داخلی فعالی وجود ندارد</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {academies.map((academy) => (
                        <div
                            key={academy.id}
                            className={styles.card}
                            onClick={() => router.push(`/academy/academies/${academy.id}`)}
                        >
                            {/* Icon */}
                            <div className={styles.iconContainer}>
                                <Icon icon={Icons.building} />
                            </div>

                            {/* Info */}
                            <div className={styles.info}>
                                <h3 className={styles.name}>{'ورزشگاه'} {academy.name}</h3>

                                {academy.address_text && (
                                    <div className={styles.detailRow}>
                                        <Icon icon={Icons.location} className={styles.detailIcon} />
                                        <span>{academy.address_text}</span>
                                    </div>
                                )}
                            </div>

                            {/* Arrow */}
                            <Icon icon={Icons.arrowLeft} className={styles.arrow} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}