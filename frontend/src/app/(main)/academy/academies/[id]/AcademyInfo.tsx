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
                <h3>
                    {academy.academy_type === 'INTERNAL' ? 'اطلاعات ورزشگاه' : 'اطلاعات پایگاه'}
                </h3>
                <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>نام</span>
                        <span className={styles.infoValue}>{academy.name}</span>
                    </div>
                    {academy.instructor_name && (
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>مسئول</span>
                            <span className={styles.infoValue} dir="ltr">{academy.instructor_name}</span>
                        </div>
                    )}
                    {academy.instructor_phone && (
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>شماره تلفن مسئول</span>
                            <a href={`tel:${academy.instructor_phone}`} className={styles.supportPhoneCompact}>
                                {academy.instructor_phone}
                            </a>
                        </div>
                    )}

                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>آدرس</span>
                        <span className={styles.infoValue}>{academy.address_text || '---'}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}