'use client'

import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useActiveUser } from '@/contexts/active_user_context'
import styles from '@/styles/home.module.css'
import Footer from '@/components/Footer/Footer'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'


export default function AcademyPage() {
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
                    بخش مدرسه تخصصی
                </h1>
                <p className={styles.welcomeText}>
                    مشاهده و ثبت نام در دوره‌های آموزشی 
                </p>
            </div>

            {/* Navigation Cards */}
            <div className={styles.navigationCards}>
                <button
                    className={styles.navCard}
                    onClick={() => router.push('/academy/register')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.edit} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>ثبت‌ نام در دوره</h3>
                        <p>ثبت ‌نام در دوره‌های آموزشی ورزشی</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                <button
                    className={styles.navCard}
                    onClick={() => router.push('/academy/courses')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.calendar} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>دوره‌های آموزشی</h3>
                        <p>مشاهده لیست دوره‌های موجود</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                <button
                    className={styles.navCard}
                    onClick={() => router.push('/academy/academies')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.building} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>ورزشگاه</h3>
                        <p>مشاهده لیست ورزشگاه های موجود</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                <button
                    className={styles.navCard}
                    onClick={() => router.push('/academy/partners')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.building} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>پایگاه ها</h3>
                        <p>مشاهده لیست پایگاه های موجود</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>
            </div>
        </div>
    )
}