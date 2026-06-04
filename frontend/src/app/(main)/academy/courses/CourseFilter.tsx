'use client'

import { useRef, useState, useEffect } from 'react'
import styles from './courses.module.css'
import FilterModal from '@/components/FilterModal/FilterModal'
import { Icon, Icons } from '@/components/icon'
import { FilterSkeleton } from './Skeletons'

interface FilterProps {
    data: any[]
    onFilterChange: (filteredData: any[]) => void
    onFilterCountChange?: (count: number) => void
    loading?: boolean
}

export default function Filter({ data, onFilterChange, onFilterCountChange, loading = false }: FilterProps) {
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
                    title="فیلتر دوره‌ها"
                    data={data}
                    filterFields={[
                        {
                            key: 'sport',
                            label: 'ورزش',
                            type: 'select',
                            extractFrom: (item) => item.sport
                        },
                        {
                            key: 'academy',
                            label: 'ورزشگاه',
                            type: 'select',
                            extractFrom: (item) => item.academy
                        },
                        {
                            key: 'gender_requirement',
                            label: 'جنسیت',
                            type: 'select',
                            options: [
                                { id: 'MALE', name: 'آقایان' },
                                { id: 'FEMALE', name: 'بانوان' }
                            ]
                        }
                    ]}
                    onFilterApply={onFilterChange}
                    onFilterCountChange={setActiveFilterCount}
                    filterChangeEvent="filteredCoursesChanged"
                    resetEvent="resetFilters"
                />
            </div>
        </>
    )
}