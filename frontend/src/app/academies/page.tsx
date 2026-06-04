'use client'

import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import styles from './academies.module.css'

export default function AcademiesPage() {
    const router = useRouter()

    return (
        <div className={styles.container}>
            <div className={styles.welcomeSection}>
                <h1 className={styles.welcomeTitle}>
                    ورزشگاه ‌های ورزشی
                </h1>
                <p className={styles.welcomeText}>
                    انتخاب کنید می‌خواهید ورزشگاه ‌های آموزشی یا تست فوتبال را ببینید
                </p>
            </div>

            <div className={styles.navigationCards}>
                <button 
                    onClick={() => router.push('/academy/academies')} 
                    className={styles.navCard}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.school} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>ورزشگاه ‌های آموزشی</h3>
                        <p>مشاهده همه ورزشگاه ‌های ورزشی</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                <button 
                    onClick={() => router.push('/football/academies')}  
                    className={styles.navCard}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.football} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>ورزشگاه ‌های فوتبال</h3>
                        <p>مشاهده همه ورزشگاه ‌های تست فوتبال</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>
            </div>
        </div>
    )
}