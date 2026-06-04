'use client'

import { Suspense, useRef, useState, useEffect } from 'react'
import styles from './footballTests.module.css'
import FootballTestsList from './FootballTestsList'
import { FootballTestsGridSkeleton } from './Skeletons'
import FootballFilter from './FootballFilter'
import AgeCategoryBadge from '@/components/AgeCategoryBadge/AgeCategoryBadge'
import { useApi } from '@/hooks/useApi'
import { useActiveUser } from '@/contexts/active_user_context'

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

    return (
        <>
            <div ref={topRef} />
            <div className={styles.container}>
                <FootballFilter
                    data={originalTests}
                    onFilterChange={handleFilterChange}
                    onFilterCountChange={setActiveFilterCount}
                    loading={loading}
                />

                <AgeCategoryBadge ageCategory={activeUser?.age_category} />

                <FootballTestsList
                    tests={filteredTests}
                    loading={loading}
                />
            </div>
        </>
    )
}