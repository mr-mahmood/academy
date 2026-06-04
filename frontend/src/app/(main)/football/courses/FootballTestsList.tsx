'use client'

import { Icon, Icons } from '@/components/icon'
import FootballTestCard from '@/components/FootballTestCard/FootballTestCard'
import type { FootballTest } from '@/types/FootballTest'
import styles from './footballTests.module.css'
import { FootballTestCardSkeleton } from './Skeletons'

interface FootballTestsListProps {
    tests: FootballTest[]
    loading?: boolean
}

export default function FootballTestsList({ tests, loading = false }: FootballTestsListProps) {
    // Function to reset filters
    const handleResetFilters = () => {
        window.dispatchEvent(new CustomEvent('resetFootballFilters'));
    }

    // Show skeletons while loading
    if (loading) {
        return (
            <div className={styles.testsList}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <FootballTestCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    if (tests.length === 0) {
        return (
            <div className={styles.emptyTests}>
                <Icon icon={Icons.football} />
                <p>هیچ تستی با فیلترهای انتخاب شده وجود ندارد</p>
                <button 
                    onClick={handleResetFilters}
                    className={styles.resetFiltersButton}
                >
                    <span>حذف همه فیلترها</span>
                </button>
            </div>
        )
    }

    return (
        <div className={styles.testsList}>
            {tests.map((test) => (
                <FootballTestCard
                    key={test.id}
                    test={test}
                    onClickUrl={`/football/courses/${test.id}`}
                />
            ))}
        </div>
    )
}