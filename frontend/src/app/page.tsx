'use client'

import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useActiveUser } from '@/contexts/active_user_context'
import styles from '@/styles/home.module.css'
import Footer from '@/components/Footer/Footer'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'


export default function HomePage() {
    const router = useRouter()
    const { activeUser, isLoadingActiveUser } = useActiveUser()

    if (isLoadingActiveUser) {
        return <LoadingSpinner />
    }

    return (
        <div className={styles.container}>

            {/* Navigation Cards */}
            <div className={styles.navigationCards}>

                <button
                    className={styles.navCard}
                    onClick={() => router.push('/academy')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.school} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>مدرسه تخصصی</h3>
                        <p>مشاهده و ثبت نام در دوره‌های آموزشی</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                <button
                    className={styles.navCard}
                    onClick={() => router.push('/football/register')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.calendar} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>تست فوتبال</h3>
                        <p>مشاهده و ثبت نام در تست های فوتبال</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                <button
                    className={`${styles.navCard} ${styles.memberCard}`}
                    onClick={() => router.push(activeUser ? '/dashboard' : '/login')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.user} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>{activeUser ? 'پنل کاربری' : 'ورود'}</h3>
                        <p>
                            {activeUser
                                ? 'مشاهده پنل کاربری'
                                : 'ورود به حساب شخصی در سامانه'
                            }
                        </p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>
            </div>

            {/* About Section */}
            <div className={styles.aboutSection}>
                <Footer />
            </div>

        </div>
    )
}