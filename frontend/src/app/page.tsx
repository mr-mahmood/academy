'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useActiveUser } from '@/contexts/active_user_context'
import styles from '../styles/home.module.css'
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
                    onClick={() => router.push('/register')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.school} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>ثبت‌ نام</h3>
                        <p>دوره‌های آموزشی | تست‌های استعدادیابی</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>


                <button
                    className={styles.navCard}
                    onClick={() => router.push('/courses')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.calendar} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>دوره‌های آموزشی و تست</h3>
                        <p>دوره‌های آموزشی | تست‌های استعدادیابی</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                <button
                    className={styles.navCard}
                    onClick={() => router.push('/academies')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.building} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>ورزشگاه‌ها</h3>
                        <p>مشاهده لیست ورزشگاه‌ ها</p>
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
                        <h3>{activeUser ? 'پنل کاربری' : 'ورود اعضا'}</h3>
                        <p>
                            {activeUser
                                ? 'مشاهده پنل کاربری و دوره‌های من'
                                : 'ورود یا ثبت نام در سامانه'
                            }
                        </p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>
            </div>

            {/* Quick Links (for logged in users) */}
            {activeUser && (
                <div className={styles.quickLinks}>
                    <h3 className={styles.sectionTitle}>دسترسی سریع</h3>
                    <div className={styles.quickLinksGrid}>
                        <button
                            className={styles.quickLink}
                            onClick={() => router.push('/dashboard')}
                        >
                            <Icon icon={Icons.dashboard} />
                            <span>داشبورد</span>
                        </button>
                        <button
                            className={styles.quickLink}
                            onClick={() => router.push('/my-courses')}
                        >
                            <Icon icon={Icons.school} />
                            <span>دوره‌های من</span>
                        </button>
                        <button
                            className={styles.quickLink}
                            onClick={() => router.push('/profile')}
                        >
                            <Icon icon={Icons.user} />
                            <span>پروفایل</span>
                        </button>
                        <button
                            className={styles.quickLink}
                            onClick={() => router.push('/payments')}
                        >
                            <Icon icon={Icons.creditCard} />
                            <span>پرداخت‌ها</span>
                        </button>
                    </div>
                </div>
            )}

            {/* About Section */}
            <div className={styles.aboutSection}>
                <Footer />
            </div>

        </div>
    )
}