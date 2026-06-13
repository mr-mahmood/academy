'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useActiveUser } from '@/contexts/active_user_context'
import styles from '@/styles/home.module.css'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import { Suspense } from 'react'

function AcademyContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { activeUser, isLoadingActiveUser } = useActiveUser()
    
    // Get academy_type from URL, default to 'INTERNAL'
    const academyType = searchParams.get('academy_type') || 'INTERNAL'
    const isInternal = academyType === 'INTERNAL'
    
    const pageConfig = {
        title: isInternal ? 'مدرسه تخصصی' : 'پایگاه‌های همکار',
        description: isInternal 
            ? 'مدرسه تخصصی، مجموعه‌های ورزشی هستند که به صورت مستقیم توسط مجموعه ما مدیریت می‌شوند. این مجموعه ها امکانات کامل و استانداردهای لازم برای برگزاری دوره‌های آموزشی را دارا می‌باشند.'
            : 'پایگاه‌های همکار، مجموعه‌های ورزشی هستند که با ما در همکاری هستند. این پایگاه‌ها با رعایت استانداردهای تعیین شده، میزبان دوره‌های آموزشی ما می‌باشند.',
        registerText: isInternal ? 'ثبت ‌نام در دوره‌های آموزشی ورزشی' : 'ثبت نام در دوره‌های پایگاه‌های همکار',
        coursesText: isInternal ? 'مشاهده لیست دوره‌های موجود' : 'مشاهده دوره‌های پایگاه‌های همکار',
        academiesText: isInternal ? 'مشاهده لیست ورزشگاه های موجود' : 'مشاهده لیست پایگاه‌های همکار',
        academyLabel: isInternal ? 'ورزشگاه' : 'پایگاه‌',
        icon: isInternal ? Icons.school : Icons.handshake
    }

    if (isLoadingActiveUser) {
        return <LoadingSpinner />
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

            {/* Navigation Cards */}
            <div className={styles.navigationCards}>
                <button
                    className={styles.navCard}
                    onClick={() => router.push(`/academy/register?academy_type=${academyType}`)}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.edit} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>ثبت‌ نام در دوره</h3>
                        <p>{pageConfig.registerText}</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                <button
                    className={styles.navCard}
                    onClick={() => router.push(`/academy/courses?academy_type=${academyType}`)}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.calendar} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>دوره‌های آموزشی</h3>
                        <p>{pageConfig.coursesText}</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                <button
                    className={styles.navCard}
                    onClick={() => router.push(`/academy/academies?academy_type=${academyType}`)}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.building} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>{pageConfig.academyLabel}</h3>
                        <p>{pageConfig.academiesText}</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>
            </div>
        </div>
    )
}

export default function AcademyPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AcademyContent />
        </Suspense>
    )
}