'use client'

import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useActiveUser } from '@/contexts/active_user_context'
import AgeCategoryBadge from '@/components/AgeCategoryBadge/AgeCategoryBadge'
import styles from '@/styles/home.module.css'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'


export default function FootballPage() {
    const router = useRouter()
    const { activeUser, isLoadingActiveUser } = useActiveUser()

    if (isLoadingActiveUser) {
        return <LoadingSpinner />
    }

    return (
        <div className={styles.container}>
            {/* Welcome Section */}
            <div className={styles.welcomeSection}>
                <h1 className={styles.welcomeTitle}>
                    تست استعدادیابی فوتبال
                </h1>
                <p className={styles.welcomeText}>
                    ثبت‌نام و مشاهده تست‌های استعدادیابی فوتبال
                </p>
            </div>

            <AgeCategoryBadge ageCategory={activeUser?.age_category} />

            {/* Navigation Cards */}
            <div className={styles.navigationCards}>
                <button
                    className={styles.navCard}
                    onClick={() => router.push('/football/register')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.edit} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>ثبت‌نام در تست</h3>
                        <p>ثبت‌نام در تست‌های استعدادیابی فوتبال</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                <button
                    className={styles.navCard}
                    onClick={() => router.push('/football/courses')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.calendar} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>تست‌های موجود</h3>
                        <p>مشاهده لیست تست‌های استعدادیابی</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>
            </div>
        </div>
    )
}