// app/academy-details/AcademyInfo.tsx
'use client'

import { Icon, Icons } from '@/components/icon'
import type { Academy } from '@/types/Academy'
import styles from './academyDetails.module.css'
import { AcademyInfoSkeleton } from './AcademySkeletons'

interface AcademyInfoProps {
    academy: Academy | null
    coursesCount: number
    loading?: boolean
    error?: string | null
}

export default function AcademyInfo({ academy, coursesCount, loading = false, error = null }: AcademyInfoProps) {
    // Show skeleton while loading
    if (loading) {
        return <AcademyInfoSkeleton />
    }

    if (error || !academy) {
        return (
            <div className={styles.errorBox}>
                <Icon icon={Icons.timesCircle} />
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