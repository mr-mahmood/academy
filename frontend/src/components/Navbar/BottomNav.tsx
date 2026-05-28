'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import styles from './BottomNav.module.css'

interface BottomNavProps {
    onLogout?: () => void
}

export default function BottomNav({ onLogout }: BottomNavProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isDark, setIsDark] = useState(false)

    // Initialize theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme-mode')

        // Default to light theme
        if (savedTheme === 'dark') {
            setIsDark(true)
            document.documentElement.classList.add('dark')
        } else {
            // Default is light theme
            setIsDark(false)
            document.documentElement.classList.remove('dark')
            // If no saved theme, save light as default
            if (!savedTheme) {
                localStorage.setItem('theme-mode', 'light')
            }
        }
    }, [])

    // Toggle theme
    const toggleTheme = () => {
        // Disable transitions temporarily
        const style = document.createElement('style');
        style.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
        document.head.appendChild(style);

        const newTheme = !isDark
        setIsDark(newTheme)

        if (newTheme) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme-mode', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme-mode', 'light')
        }

        // Force reflow and remove the disable style
        setTimeout(() => {
            document.head.removeChild(style);
        }, 50);
    };

    return (
        <nav className={styles.bottomNav}>
            <button
                onClick={() => router.push('/')}
                className={`${styles.navItem} ${pathname === '/' ? styles.navItemActive : ''}`}
            >
                <Icon icon={Icons.home} className={styles.navIcon} />
                <span className={styles.navLabel}>صفحه اصلی</span>
            </button>

            <button
                onClick={() => router.push('/dashboard')}
                className={`${styles.navItem} ${pathname === '/dashboard' ? styles.navItemActive : ''}`}
            >
                <Icon icon={Icons.dashboard} className={styles.navIcon} />
                <span className={styles.navLabel}>داشبورد</span>
            </button>

            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className={styles.navItem}
                aria-label={isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
            >
                <Icon
                    icon={isDark ? Icons.sun : Icons.moon}
                    className={styles.navIcon}
                />
                <span className={styles.navLabel}>
                    {isDark ? 'روشن' : 'تاریک'}
                </span>
            </button>
        </nav>
    )
}