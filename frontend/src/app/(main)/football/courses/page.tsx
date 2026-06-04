'use client'

import { Suspense, useRef, useState, useEffect } from 'react'
import styles from './footballTests.module.css'
import FootballTestsList from './FootballTestsList'
import { FootballTestsGridSkeleton } from './Skeletons'
import FootballFilter from './FootballFilter'
import { useApi } from '@/hooks/useApi'
import { useActiveUser } from '@/contexts/active_user_context'
import { Icon, Icons } from '@/components/icon'

export default function FootballTestsStreamingPage() {
    const topRef = useRef<HTMLDivElement>(null)
    const { apiFetch } = useApi()
    const { activeUser } = useActiveUser()
    const [loading, setLoading] = useState(true)
    const [originalTests, setOriginalTests] = useState<any[]>([])
    const [filteredTests, setFilteredTests] = useState<any[]>([])
    const [activeFilterCount, setActiveFilterCount] = useState(0)

    // Fetch football tests when page loads
    useEffect(() => {
        const fetchTests = async () => {
            setLoading(true)
            try {
                const result = await apiFetch({
                    url: 'api/football/courses/',
                    method: 'GET'
                })

                if (result.success) {
                    const tests = result.data?.courses || result.data || []
                    setOriginalTests(tests)
                    setFilteredTests(tests)
                }
            } catch (error) {
                console.error('Error fetching football tests:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchTests()
    }, [])

    useEffect(() => {
        const handleFilterCount = (e: CustomEvent) => {
            setActiveFilterCount(e.detail)
        }
        window.addEventListener('filterCountChanged', handleFilterCount as EventListener)
        return () => window.removeEventListener('filterCountChanged', handleFilterCount as EventListener)
    }, [])

    const handleFilterChange = (newFilteredData: any[]) => {
        setFilteredTests(newFilteredData)
    }

    const ageCategoryLabels: Record<string, string> = {
        'U12': 'زیر ۱۲ سال',
        'U13': 'زیر ۱۳ سال',
        'U14': 'زیر ۱۴ سال',
        'U15': 'زیر ۱۵ سال',
        'U17': 'زیر ۱۷ سال',
        'U18': 'زیر ۱۸ سال',
        'YOUTH': 'جوانان',
        'U21': 'زیر ۲۱ سال',
    }

    return (
        <>
            <div ref={topRef} />
            <div className={styles.container}>
                {/* Age Category Info Badge */}
                {activeUser?.age_category && (
                    <div className={styles.ageCategoryBanner}>
                        <div className={styles.ageCategoryIcon}>
                            <Icon icon={Icons.user} />
                        </div>
                        <div className={styles.ageCategoryContent}>
                            <span className={styles.ageCategoryLabel}>رده سنی شما:</span>
                            <span className={styles.ageCategoryValue}>{ageCategoryLabels[activeUser.age_category]}</span>
                        </div>
                        <div className={styles.ageCategoryNote}>
                            <Icon icon={Icons.info} />
                            <span>این رده سنی بر اساس تاریخ تولد شما محاسبه شده است. در صورت مغایرت، تاریخ تولد خود را در پروفایل اصلاح کنید.</span>
                        </div>
                    </div>
                )}

                <FootballFilter
                    data={originalTests}
                    onFilterChange={handleFilterChange}
                    onFilterCountChange={setActiveFilterCount}
                    loading={loading}
                />

                <FootballTestsList
                    tests={filteredTests}
                    loading={loading}
                />
            </div>
        </>
    )
}