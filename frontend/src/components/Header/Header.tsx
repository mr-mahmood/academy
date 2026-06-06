// components/AcademyHeader/AcademyHeader.jsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useActiveUser } from '@/contexts/active_user_context'
import styles from './Header.module.css'

// Main Header Component
export default function AcademyHeader() {
    const { activeUser } = useActiveUser()
    const router = useRouter()

    const handleLogoutClick = () => {
        sessionStorage.removeItem('userPhone')
        localStorage.removeItem('currentUser')
        router.push('/')
    }

    return (
        <div className={styles.headerWrapper}>
            <div className={styles.customHeader}>
                <div className={styles.headerLeft}>
                    <div className={styles.logoIcon}>
                        <div className={styles.logoCircle}>
                            <img
                                src="/logo.png"
                                alt="باشگاه فولاد مبارکه سپاهان"
                                className={styles.logoImage}
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.headerCenter}>
                    <span className={styles.logoText}>
                        باشگاه فولاد مبارکه سپاهان
                    </span>
                </div>
            </div>
        </div>
    )
}