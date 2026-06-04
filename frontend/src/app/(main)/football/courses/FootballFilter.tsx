'use client'

import { useRef, useState, useEffect } from 'react'
import styles from './footballTests.module.css'
import FilterModal from '@/components/FilterModal/FilterModal'
import { Icon, Icons } from '@/components/icon'
import { FilterSkeleton } from './Skeletons'

interface FootballFilterProps {
    data: any[]
    onFilterChange: (filteredData: any[]) => void
    onFilterCountChange?: (count: number) => void
    loading?: boolean
}

export default function FootballFilter({ 
    data, 
    onFilterChange, 
    onFilterCountChange, 
    loading = false,
}: FootballFilterProps) {
    const filterRef = useRef<HTMLDivElement>(null)
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [activeFilterCount, setActiveFilterCount] = useState(0)

    // Listen for filter count changes
    useEffect(() => {
        const handleFilterCount = (e: CustomEvent) => {
            setActiveFilterCount(e.detail)
            if (onFilterCountChange) {
                onFilterCountChange(e.detail)
            }
        }
        
        window.addEventListener('filterCountChanged', handleFilterCount as EventListener)
        return () => window.removeEventListener('filterCountChanged', handleFilterCount as EventListener)
    }, [onFilterCountChange])

    // Show skeleton while loading
    if (loading) {
        return <FilterSkeleton />
    }

    // Age category options
    const ageCategoryOptions = [
        { id: 'U12', name: 'زیر ۱۲ سال (U12)' },
        { id: 'U13', name: 'زیر ۱۳ سال (U13)' },
        { id: 'U14', name: 'زیر ۱۴ سال (U14)' },
        { id: 'U15', name: 'زیر ۱۵ سال (U15)' },
        { id: 'U17', name: 'زیر ۱۷ سال (U17)' },
        { id: 'U18', name: 'زیر ۱۸ سال (U18)' },
        { id: 'YOUTH', name: 'جوانان (YOUTH)' },
        { id: 'U21', name: 'زیر ۲۱ سال (U21)' },
    ]

    // Position options
    const positionOptions = [
        { id: 'GK', name: 'دروازه بان (GK)' },
        { id: 'CB', name: 'مدافع میانی (CB)' },
        { id: 'LB', name: 'مدافع چپ (LB)' },
        { id: 'RB', name: 'مدافع راست (RB)' },
        { id: 'CM', name: 'هافبک وسط (CM)' },
        { id: 'RW', name: 'وینگر راست (RW)' },
        { id: 'LW', name: 'وینگر چپ (LW)' },
        { id: 'ST', name: 'مهاجم (ST)' },
    ]

    return (
        <>
            {/* Filter Section */}
            <div className={styles.filterSection}>
                <button 
                    onClick={() => setIsFilterModalOpen(true)}
                    className={`${styles.filterButton} ${activeFilterCount > 0 ? styles.filterButtonActive : ''}`}
                >
                    <Icon icon={Icons.filter} />
                    <span>فیلترها</span>
                    {activeFilterCount > 0 && (
                        <span className={styles.filterBadge}>{activeFilterCount}</span>
                    )}
                    <Icon icon={Icons.chevronDown} className={styles.chevron} />
                </button>
            </div>
            
            <div ref={filterRef}>
                <FilterModal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    title="فیلتر تست‌های فوتبال"
                    data={data}
                    filterFields={[
                        {
                            key: 'position',
                            label: 'پست تخصصی',
                            type: 'select',
                            options: positionOptions,
                            extractFrom: (item) => ({ id: item.position, name: item.position_display })
                        },
                        {
                            key: 'academy',
                            label: 'آکادمی',
                            type: 'select',
                            extractFrom: (item) => item.academy
                        },
                        {
                            key: 'age_category',
                            label: 'رده سنی',
                            type: 'select',
                            options: ageCategoryOptions,
                            extractFrom: (item) => ({ id: item.age_category, name: item.age_category_display })
                        },
                    ]}
                    onFilterApply={onFilterChange}
                    onFilterCountChange={setActiveFilterCount}
                    filterChangeEvent="filteredFootballTestsChanged"
                    resetEvent="resetFootballFilters"
                />
            </div>
        </>
    )
}