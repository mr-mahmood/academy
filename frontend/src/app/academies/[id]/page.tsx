'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import styles from './AcademyDetails.module.css'
import AcademyInfo from './AcademyInfo'
import AcademyFilter from './AcademyCourseFilter'
import AcademyCoursesList from './AcademyCoursesList'
import { AcademyInfoSkeleton } from './AcademySkeletons'

export default function AcademyDetailsPage() {
    const params = useParams()
    const academyId = params.id as string
    const [activeTab, setActiveTab] = useState<'info' | 'map' | 'courses'>('info')
    
    // Key to force re-mount of courses components when tab changes
    const [coursesKey, setCoursesKey] = useState(0)

    const handleTabChange = (tab: 'info' | 'map' | 'courses') => {
        setActiveTab(tab)
        if (tab === 'courses') {
            // Increment key to force re-mount and reset filters
            setCoursesKey(prev => prev + 1)
            // Also clear persisted filter state
            // You'll need to expose a function from AcademyFilter to reset
            window.dispatchEvent(new CustomEvent('resetFilters'))
        }
    }

    return (
        <div className={styles.container}>
            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'info' ? styles.activeTab : ''}`}
                    onClick={() => handleTabChange('info')}
                >
                    <Icon icon={Icons.info} />
                    <span>اطلاعات</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'map' ? styles.activeTab : ''}`}
                    onClick={() => handleTabChange('map')}
                >
                    <Icon icon={Icons.location} />
                    <span>نقشه</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'courses' ? styles.activeTab : ''}`}
                    onClick={() => handleTabChange('courses')}
                >
                    <Icon icon={Icons.school} />
                    <span>دوره‌ها</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'info' && (
                    <AcademyInfo academyId={academyId} />
                )}

                {activeTab === 'courses' && (
                    // Add key to force re-mount
                    <div key={coursesKey}>
                        <AcademyFilter academyId={academyId} />
                        <AcademyCoursesList />
                    </div>
                )}

                {activeTab === 'map' && (
                    <div className={styles.mapTab}>
                        <div className={styles.mapPlaceholder}>
                            <Icon icon={Icons.location} />
                            <h3>نقشه</h3>
                            <p>این بخش به زودی فعال خواهد شد</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}