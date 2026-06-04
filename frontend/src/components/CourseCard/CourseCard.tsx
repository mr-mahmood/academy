// components/CourseCard/CourseCard.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import styles from './CourseCard.module.css'
import { Sport } from '@/types/Sport'
import { Academy } from '@/types/Academy'
import { Schedule } from '@/types/Schedule'

interface CourseCardProps {
    id: number
    sport?: Sport
    academy: Academy
    schedule?: Schedule[]
    totalSessions?: number
    price: string | number
    gender: 'MALE' | 'FEMALE' | string
    status?: 'WAITING_FOR_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'ACTIVE' | 'FULL' | string
    enrollmentStatus?: 'WAITING_FOR_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | string
    showAddress?: boolean
    showSessions?: boolean
    onClickUrl?: string
    className?: string
}

export default function CourseCard({
    id,
    sport,
    academy,
    schedule,
    totalSessions,
    price,
    gender,
    status,
    enrollmentStatus,
    showAddress = true,
    showSessions = true,
    onClickUrl,
    className = '',
}: CourseCardProps) {
    const router = useRouter()

    const getDayName = (dayName: string) => {
        const days: Record<string, string> = {
            'Saturday': 'شنبه',
            'Sunday': 'یکشنبه',
            'Monday': 'دوشنبه',
            'Tuesday': 'سه‌شنبه',
            'Wednesday': 'چهارشنبه',
            'Thursday': 'پنجشنبه',
            'Friday': 'جمعه'
        }
        return days[dayName] || dayName
    }

    const getStatusDisplay = (statusValue: string) => {
        const statusMap: Record<string, { label: string; className: string; icon: any }> = {
            'WAITING_FOR_PAYMENT': {
                label: 'پیش ثبت نام',
                className: 'statusWarning',
                icon: Icons.clock
            },
            'CONFIRMED': {
                label: 'تایید شده',
                className: 'statusSuccess',
                icon: Icons.check
            },
            'CANCELLED': {
                label: 'لغو شده',
                className: 'statusDanger',
                icon: Icons.timesCircle
            },
            'COMPLETED': {
                label: 'اتمام یافته',
                className: 'statusInfo',
                icon: Icons.verified
            },
            'ACTIVE': {
                label: 'فعال',
                className: 'statusSuccess',
                icon: Icons.check
            },
            'FULL': {
                label: 'تکمیل ظرفیت',
                className: 'statusWarning',
                icon: Icons.users
            },
        }
        return statusMap[statusValue] || { label: statusValue, className: 'statusDefault', icon: Icons.info }
    }

    const getGenderDisplay = (genderValue: string) => {
        switch (genderValue) {
            case 'MALE': return 'آقایان'
            case 'FEMALE': return 'بانوان'
            default: return 'نامشخص'
        }
    }

    const formatPrice = (priceValue: string | number) => {
        return (Number(priceValue) / 10).toLocaleString()
    }

    const displayStatus = enrollmentStatus || status
    const statusInfo = displayStatus ? getStatusDisplay(displayStatus) : null

    const handleClick = () => {
        if (onClickUrl) {
            router.push(onClickUrl)
        }
    }

    return (
        <div
            className={`${styles.card} ${className}`}
            onClick={handleClick}
        >

            {/* Sport & Sessions */}
            <div className={styles.mainSection}>
                <div className={styles.iconContainer}>
                    <Icon icon={Icons.football} />
                </div>
                <div className={styles.mainInfo}>
                    <h3 className={styles.title}>
                        {sport?.name || academy.name}
                    </h3>
                    {showSessions && totalSessions && (
                        <span className={styles.sessionsText}>
                            {totalSessions} جلسه
                        </span>
                    )}
                </div>
                {statusInfo && (
                    <div className={`${styles.statusBadge} ${styles[statusInfo.className]}`}>
                        <Icon icon={statusInfo.icon} className={styles.statusIcon} />
                        <span>{statusInfo.label}</span>
                    </div>
                )}
            </div>

            {/* Gender Section */}
            <div className={styles.genderSection}>
                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <Icon icon={Icons.user} className={styles.genderIcon} />
                    <span className={styles.genderLabel}>مناسب</span>
                </div>
                <span className={styles.genderValue}>{getGenderDisplay(gender)}</span>
            </div>

            {/* Schedule */}
            {schedule && schedule.length > 0 && (
                <div className={styles.scheduleContainer}>
                    {schedule.map((sched, index) => (
                        <div key={sched.id || index} className={styles.scheduleRow}>
                            <div className={styles.scheduleDay}>
                                <Icon icon={Icons.calendar} className={styles.scheduleIcon} />
                                <span>{getDayName(sched.weekday_name)}</span>
                            </div>
                            <div className={styles.scheduleTime}>
                                <span>
                                    {sched.end_time?.slice(0, 5)} - {sched.start_time?.slice(0, 5)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Address */}
            <div className={styles.addressRow}>
                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <Icon icon={Icons.building} className={styles.addressIcon} />
                    <span className={styles.addressValue}>ورزشگاه {academy.name}</span>
                    <span className={styles.addressSeparator} />
                </div>
                {showAddress && academy.address_text && (
                    <span className={styles.addressDetail}>{academy.address_text}</span>
                )}
            </div>

            {/* Bottom - Price */}
            <div className={styles.bottom}>
                <div className={styles.priceSection}>
                    <span className={styles.priceLabel}>هزینه دوره</span>
                    <span className={styles.price}>{formatPrice(price)} تومان</span>
                </div>
            </div>
        </div>
    )
}