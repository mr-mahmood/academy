'use client'

import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import styles from './FootballTestCard.module.css'
import { FootballTest } from '@/types/FootballTest'

interface FootballTestCardProps {
    test: FootballTest
    onClickUrl?: string
    className?: string
}

export default function FootballTestCard({
    test,
    onClickUrl,
    className = '',
}: FootballTestCardProps) {
    const router = useRouter()

    const getAgeCategoryLabel = (ageCategory: string) => {
        const ageMap: Record<string, string> = {
            'U12': 'زیر ۱۲ سال',
            'U13': 'زیر ۱۳ سال',
            'U14': 'زیر ۱۴ سال',
            'U15': 'زیر ۱۵ سال',
            'U17': 'زیر ۱۷ سال',
            'U18': 'زیر ۱۸ سال',
            'YOUTH': 'جوانان',
            'U21': 'زیر ۲۱ سال',
        }
        return ageMap[ageCategory] || ageCategory
    }

    const formatPrice = (price: string | number) => {
        return (Number(price) / 10).toLocaleString()
    }

    const formatPersianDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        }).format(date)
    }

    const formatTime = (timeString: string) => {
        return timeString.slice(0, 5)
    }

    const getGenderDisplay = (genderValue: string) => {
        switch (genderValue) {
            case 'MALE': return 'آقایان'
            case 'FEMALE': return 'بانوان'
            default: return 'نامشخص'
        }
    }

    const getStatusDisplay = (status: string) => {
        const statusMap: Record<string, { label: string; className: string; icon: any }> = {
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
        }
        return statusMap[status] || { label: status, className: 'statusDefault', icon: Icons.info }
    }

    const statusInfo = getStatusDisplay(test.status)

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
            {/* Position & Status */}
            <div className={styles.mainSection}>
                <div className={styles.iconContainer}>
                    <Icon icon={Icons.football} />
                </div>
                <div className={styles.mainInfo}>
                    <h3 className={styles.title}>
                        {'پست '} {test.position_display} ({test.position})
                    </h3>
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
                <span className={styles.genderValue}>{getGenderDisplay(test.gender_requirement)}</span>
            </div>

            {/* Test Date & Time */}
            {/* <div className={styles.dateTimeContainer}>
                <div className={styles.dateTimeRow}>
                    <div className={styles.dateTimeDay}>
                        <Icon icon={Icons.calendar} className={styles.dateTimeIcon} />
                        <span>تاریخ</span>
                    </div>
                    <div className={styles.dateTimeTime}>
                        <span>{formatPersianDate(test.test_date)}</span>
                    </div>
                </div>
                <div className={styles.dateTimeRow}>
                    <div className={styles.dateTimeDay}>
                        <Icon icon={Icons.clock} className={styles.dateTimeIcon} />
                        <span>ساعت</span>
                    </div>
                    <div className={styles.dateTimeTime}>
                        <span>{formatTime(test.start_time)} - {formatTime(test.end_time)}</span>
                    </div>
                </div>
            </div> */}

            {/* Academy & Address */}
            <div className={styles.addressRow}>
                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <Icon icon={Icons.building} className={styles.addressIcon} />
                    <span className={styles.addressValue}>آکادمی {test.academy.name}</span>
                    <span className={styles.addressSeparator} />
                </div>
                {test.academy.address_text && (
                    <span className={styles.addressDetail}>{test.academy.address_text}</span>
                )}
            </div>

            {/* Bottom - Price */}
            <div className={styles.bottom}>
                <div className={styles.priceSection}>
                    <span className={styles.priceLabel}>هزینه تست</span>
                    <span className={styles.price}>{formatPrice(test.price)} تومان</span>
                </div>
            </div>
        </div>
    )
}