'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import styles from './profile.module.css'
import { useActiveUser } from '@/contexts/active_user_context'
import UserForm from '@/components/UserForm'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

export default function ProfilePage() {
    const router = useRouter()
    const { activeUser, isLoadingActiveUser } = useActiveUser()
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        const initialTheme = savedTheme || 'light'
        setTheme(initialTheme)
        document.documentElement.setAttribute('data-theme', initialTheme)
    }, [])


    const handleLogout = () => {
        sessionStorage.removeItem('userPhone')
        localStorage.removeItem('currentUser')
        router.push('/')
    }

    if (isLoadingActiveUser) {
        return <LoadingSpinner/>
    }

    return (
        <div className={styles.content}>
            {/* Avatar Section */}
            <div className={styles.avatarSection}>
                <div className={styles.userInfo}>
                    <h2 className={styles.userName}>
                        {activeUser?.full_name}
                    </h2>
                    <p className={styles.userPhone} dir="ltr">{activeUser?.phone_number}</p>
                </div>
                <div className={styles.avatarWrapper}>
                    <div className={styles.avatar}>
                        <Icon icon={Icons.user} />
                    </div>
                    <button className={styles.editAvatarBtn}>
                        <Icon icon={Icons.edit} size="xs" />
                    </button>
                </div>
            </div>

            <UserForm
                key={refreshKey}
                mode="profile"
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />
        </div>
    )
}