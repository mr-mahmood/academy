// app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import styles from './dashboard.module.css'
import { useActiveUser } from '@/contexts/active_user_context'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

export default function DashboardPage() {
    const router = useRouter()
    const { setActiveUser, isLoadingActiveUser } = useActiveUser()

    const handleLogout = async () => {
        try {
            // Send logout request to API
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/logout/`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                console.error('Logout failed:', await response.text());
            }
        } catch (error) {
            console.error('Logout API error:', error);
        }

        // CRITICAL: Clear context FIRST before storage
        setActiveUser(null); // Make sure you have access to setActiveUser from your context

        // Clear all storage
        sessionStorage.clear();
        localStorage.clear();

        // Clear specific items if needed
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('userPhone');

        // Clear cookies (your existing code)
        document.cookie.split(";").forEach(function (c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=; expires=" + new Date().toUTCString() + "; path=/");
        });

        // Use replace to navigate
        router.replace('/');
    };

    if (isLoadingActiveUser) {
        return <LoadingSpinner />
    }

    return (
        <div className={styles.container}>
            {/* Navigation Cards */}
            <div className={styles.selectionCards}>
                {/* Profile/Info */}
                <button
                    className={styles.selectionCard}
                    onClick={() => router.push('/profile')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.user} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>اطلاعات من</h3>
                        <p>مشاهده و ویرایش اطلاعات شخصی</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                {/* My Courses */}
                <button
                    className={styles.selectionCard}
                    onClick={() => router.push('/my-courses')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.school} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>دوره‌های من</h3>
                        <p>مشاهده دوره‌هایی که ثبت نام کرده‌اید</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                {/* My Tests */}
                <button
                    className={styles.selectionCard}
                    onClick={() => router.push('/my-tests')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.school} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>تست های من</h3>
                        <p>مشاهده تست هایی که ثبت نام کرده‌اید</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>

                {/* Payments/Financial */}
                {/* <button
                    className={styles.selectionCard}
                    onClick={() => router.push('/payments')}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.creditCard} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>پرداخت‌های من</h3>
                        <p>مشاهده تاریخچه پرداخت‌ها و صورتحساب</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button> */}

                {/* Logout */}
                <button
                    className={`${styles.selectionCard} ${styles.logoutCard}`}
                    onClick={handleLogout}
                >
                    <div className={styles.cardIcon}>
                        <Icon icon={Icons.logout} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>خروج از حساب</h3>
                        <p>برای خروج از حساب کاربری کلیک کنید</p>
                    </div>
                    <Icon icon={Icons.arrowLeft} className={styles.cardArrow} />
                </button>
            </div>
        </div>
    )
}