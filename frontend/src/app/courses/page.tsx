'use client'

import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import styles from './course.module.css'

export default function CoursesPage() {
    const router = useRouter()

    return (
        <div className={styles.container}>
            {/* Welcome Section */}
            <div className={styles.welcomeSection}>
                <h1 className={styles.welcomeTitle}>
                    دوره‌ها و تست‌های ورزشی
                </h1>
                <p className={styles.welcomeText}>
                    برای مشاهده دوره‌های آموزشی آکادمی یا تست‌های استعدادیابی فوتبال، یکی از گزینه‌های زیر را انتخاب کنید
                </p>
            </div>

            {/* Navigation Cards */}
            <div className={styles.navigationCards}>
                {/* Academy Button - Goes to Academy Courses List */}
                <button 
                    onClick={() => router.push('/academy/courses')} 
                    className={styles.navCard}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.school} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>دوره‌های آکادمی</h3>
                        <p>مشاهده دوره‌های آموزشی ورزشی آکادمی</p>
                        <div className={styles.cardTags}>
                            <span>دوره‌های تخصصی</span>
                            <span>مربیان حرفه‌ای</span>
                            <span>فضای تخصصی</span>
                        </div>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                {/* Football Test Button - Goes to Football Tests List */}
                <button 
                    onClick={() => router.push('/football/courses')}  
                    className={styles.navCard}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.football} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>تست‌های استعدادیابی فوتبال</h3>
                        <p>مشاهده تست‌های استعدادیابی فوتبال حرفه‌ای</p>
                        <div className={styles.cardTags}>
                            <span>ارزیابی تخصصی</span>
                            <span>پست‌های مختلف</span>
                            <span>رده‌های سنی</span>
                        </div>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>
            </div>
        </div>
    )
}