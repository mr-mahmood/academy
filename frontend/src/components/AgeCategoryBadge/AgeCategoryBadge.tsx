'use client'

import { Icon, Icons } from '@/components/icon'
import styles from './AgeCategoryBadge.module.css'

interface AgeCategoryBadgeProps {
    ageCategory?: string | null
    className?: string
}

const ageCategoryLabels: Record<string, string> = {
    'U12': 'زیر ۱۲ سال (U12)',
    'U13': 'زیر ۱۳ سال (U13)',
    'U14': 'زیر ۱۴ سال (U14)',
    'U15': 'زیر ۱۵ سال (U15)',
    'U17': 'زیر ۱۷ سال (U17)',
    'U18': 'زیر ۱۸ سال (U18)',
    'YOUTH': 'جوانان (YOUTH)',
    'U21': 'امید (U21)' ,
    'OOR': 'خارج از محدوده سنی',
}

export default function AgeCategoryBadge({ ageCategory, className = '' }: AgeCategoryBadgeProps) {
    if (!ageCategory) {
        return null
    }

    return (
        <div className={`${styles.ageCategoryBanner} ${className}`}>
            <div className={styles.ageCategoryIcon}>
                <Icon icon={Icons.user} />
            </div>
            <div className={styles.ageCategoryContent}>
                <span className={styles.ageCategoryLabel}>رده سنی شما:</span>
                <span className={styles.ageCategoryValue}>{ageCategoryLabels[ageCategory]}</span>
            </div>
            <div className={styles.ageCategoryNote}>
                <Icon icon={Icons.info} />
                <span>این رده سنی بر اساس تاریخ تولد شما محاسبه شده است. در صورت مغایرت، تاریخ تولد خود را در پروفایل اصلاح کنید.</span>
            </div>
        </div>
    )
}