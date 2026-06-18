'use client'

import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import styles from '@/styles/home.module.css'
import Footer from '@/components/Footer/Footer'


export default function HomePage() {
    const router = useRouter()

    return (
        <div className={styles.container}>

            {/* Navigation Cards */}
            <div className={styles.navigationCards}>

                <button
                    className={styles.navCard}
                    onClick={() => router.push('/academy?academy_type=INTERNAL')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.school} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>مدرسه تخصصی</h3>
                        <p>مشاهده و ثبت نام در دوره‌های آموزشی مدرسه های تخصصی</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                <button
                    className={styles.navCard}
                    onClick={() => router.push('/academy/academies?academy_type=PARTNER_BASE')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.handshake} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>پایگاه ها</h3>
                        <p>مشاهده و ثبت نام در دوره‌های آموزشی پایگاه های سراسر کشور</p>
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

                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
            </div>

            {/* About Section */}
            <div className={styles.aboutSection}>
                <Footer />
            </div>

        </div>
    )
}