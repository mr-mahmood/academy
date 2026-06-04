'use client'

import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import styles from './register.module.css'

export default function UnifiedRegisterPage() {
    const router = useRouter()

    return (
        <div className={styles.container}>
            {/* Welcome Section */}
            <div className={styles.welcomeSection}>
                <h1 className={styles.welcomeTitle}>
                    ثبت‌نام در دوره‌ها و تست‌ها
                </h1>
                <p className={styles.welcomeText}>
                    برای ثبت‌نام در دوره‌های آموزشی آکادمی یا تست‌های استعدادیابی فوتبال، یکی از گزینه‌های زیر را انتخاب کنید
                </p>
            </div>

            {/* Navigation Cards */}
            <div className={styles.navigationCards}>
                {/* Academy Button */}
                <button
                    onClick={() => router.push('/academy/register')}
                    className={styles.navCard}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.school} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>دوره‌های آکادمی</h3>
                        <p>ثبت‌نام در دوره‌های آموزشی ورزشی آکادمی</p>
                        <div className={styles.cardTags}>
                            <span>دوره‌های تخصصی</span>
                            <span>مربیان حرفه‌ای</span>
                            <span>فضای تخصصی</span>
                        </div>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                {/* Football Test Button */}
                <button
                    onClick={() => router.push('/football/register')}
                    className={styles.navCard}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.football} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>تست‌های استعدادیابی فوتبال</h3>
                        <p>شرکت در تست‌های استعدادیابی فوتبال حرفه‌ای</p>
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