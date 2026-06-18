'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useApi } from '@/hooks/useApi'
import type { Academy } from '@/types/Academy'
import styles from './academies.module.css'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

function AcademiesContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const academyType = searchParams.get('academy_type') || 'INTERNAL'
    const [academies, setAcademies] = useState<Academy[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { apiFetch } = useApi()

    const isInternal = academyType === 'INTERNAL'
    const typeLabel = isInternal ? 'ورزشگاه' : 'پایگاه'
    const emptyMessage = isInternal ? 'ورزشگاه یافت نشد' : 'پایگاه همکار یافت نشد'
    const emptyDescription = isInternal ? 'در حال حاضر ورزشگاه فعالی وجود ندارد' : 'در حال حاضر پایگاه همکار فعالی وجود ندارد'

    const pageConfig = {
        title: isInternal ? 'مدرسه تخصصی' : 'پایگاه‌های همکار',
        description: isInternal
            ? 'مدرسه تخصصی، مجموعه‌های ورزشی هستند که به صورت مستقیم توسط مجموعه ما مدیریت می‌شوند. این مجموعه ها امکانات کامل و استانداردهای لازم برای برگزاری دوره‌های آموزشی را دارا می‌باشند.'
            : 'پایگاه‌های همکار، مجموعه‌های ورزشی هستند که با ما در همکاری هستند. این پایگاه‌ها با رعایت استانداردهای تعیین شده، میزبان دوره‌های آموزشی ما می‌باشند.',
        icon: isInternal ? Icons.school : Icons.handshake
    }

    useEffect(() => {
        const fetchAcademies = async () => {
            setLoading(true)
            setError(null)

            try {
                const result = await apiFetch({
                    url: `api/academy/academies?academy_type=${academyType}`,
                    method: 'GET'
                })

                if (result.success && result.data?.academies) {
                    setAcademies(result.data?.academies)
                } else if (result.success && Array.isArray(result.data)) {
                    setAcademies(result.data)
                } else {
                    setAcademies([])
                }
            } catch (error) {
                console.error('Error fetching academies:', error)
                setError(`خطا در دریافت اطلاعات ${typeLabel}ها`)
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
            {/* Dynamic Explanation Box based on academy_type */}
            <div className={styles.explanationBox}>
                <Icon icon={pageConfig.icon} className={styles.explanationIcon} />
                <div className={styles.explanationContent}>
                    <h4>{pageConfig.title}</h4>
                    <p>{pageConfig.description}</p>
                </div>
            </div>
            {academies.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Icon icon={Icons.building} />
                    </div>
                    <h3>{emptyMessage}</h3>
                    <p>{emptyDescription}</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {academies.map((academy) => (
                        <div
                            key={academy.id}
                            className={styles.card}
                            onClick={() => router.push(`/academy/academies/${academy.id}?academy_type=${academyType}`)}
                        >
                            <div className={styles.iconContainer}>
                                <Icon icon={Icons.building} />
                            </div>

                            <div className={styles.info}>
                                <h3 className={styles.name}>{typeLabel} {academy.name.replace('پایگاه ', '')}</h3>

                                {academy.address_text && (
                                    <div className={styles.detailRow}>
                                        <Icon icon={Icons.location} className={styles.detailIcon} />
                                        <span>{academy.address_text}</span>
                                    </div>
                                )}
                            </div>

                            <Icon icon={Icons.arrowLeft} className={styles.arrow} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function AcademiesListPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AcademiesContent />
        </Suspense>
    )
}