'use client'

import { useRef, useState, useEffect } from 'react'
import styles from './my-tests.module.css'
import FilterModal from '@/components/FilterModal/FilterModal'
import { Icon, Icons } from '@/components/icon'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import type { FootballEnrollment } from '@/types/FootballEnrollment'
import { useApi } from '@/hooks/useApi'

interface MyFootballTestsFilterProps {
    onEnrollmentsLoaded?: (enrollments: FootballEnrollment[]) => void
    onFilterChange?: (filteredData: any[]) => void
    onFilterCountChange?: (count: number) => void
    isLoading?: boolean
}

export default function MyFootballTestsFilter({
    onEnrollmentsLoaded,
    onFilterChange,
    onFilterCountChange,
    isLoading = false
}: MyFootballTestsFilterProps) {
    const filterRef = useRef<HTMLDivElement>(null)
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [activeFilterCount, setActiveFilterCount] = useState(0)
    const [allEnrollments, setAllEnrollments] = useState<FootballEnrollment[]>([])
    const { apiFetch } = useApi()
    const [fetched, setFetched] = useState(false)

    // Fetch enrollments when component mounts - ONLY ONCE
    useEffect(() => {
        if (fetched) return

        const fetchEnrollments = async () => {
            try {
                const result = await apiFetch({
                    url: 'api/football/enrollment/',
                    method: 'GET'
                })

                if (result.success) {
                    let enrollmentsData: FootballEnrollment[] = []
                    if (result.data?.enrollments) {
                        enrollmentsData = result.data.enrollments
                    }

                    setAllEnrollments(enrollmentsData)
                    setFetched(true)

                    if (onEnrollmentsLoaded) {
                        onEnrollmentsLoaded(enrollmentsData)
                    }

                    // Dispatch initial tests (all enrollments, no filters)
                    const initialTests = enrollmentsData.map(enrollment => ({
                        ...enrollment.course,
                        enrollment_status: enrollment.enrollment_status
                    }))

                    window.dispatchEvent(new CustomEvent('myFootballTestsFilteredChanged', {
                        detail: initialTests
                    }))
                }
            } catch (error) {
                console.error('Error fetching football enrollments:', error)
                if (onEnrollmentsLoaded) {
                    onEnrollmentsLoaded([])
                }
            }
        }

        fetchEnrollments()
    }, [apiFetch, onEnrollmentsLoaded, fetched])

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

    // Show loading spinner while loading
    if (isLoading) {
        return <LoadingSpinner />
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
        { id: 'U21', name: 'امید (U21)' },
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
                    title="فیلتر تست‌های من"
                    data={allEnrollments.map(enrollment => ({
                        ...enrollment.course,
                        enrollment_status: enrollment.enrollment_status
                    }))}
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
                        {
                            key: 'enrollment_status',
                            label: 'وضعیت ثبت‌نام',
                            type: 'select',
                            options: [
                                { id: 'WAITING_FOR_PAYMENT', name: 'در انتظار پرداخت' },
                                { id: 'CONFIRMED', name: 'تایید شده' },
                                { id: 'CANCELLED', name: 'لغو شده' },
                                { id: 'COMPLETED', name: 'اتمام یافته' },
                            ],
                            extractFrom: (item) => ({ id: item.enrollment_status, name: '' })
                        }
                    ]}
                    onFilterApply={onFilterChange}
                    onFilterCountChange={setActiveFilterCount}
                    filterChangeEvent="myFootballTestsFilteredChanged"
                    resetEvent="resetMyFootballTestsFilters"
                />
            </div>
        </>
    )
}