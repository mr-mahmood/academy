'use client'

import { useState, useEffect, useRef } from 'react'
import { Icon, Icons } from '@/components/icon'
import styles from './FilterModal.module.css'

interface FilterField {
    key: string
    label: string
    type: 'select' | 'radio'
    options?: { id: string | number; name: string }[]
    extractFrom?: (item: any) => any
}

interface FilterModalProps {
    // Modal controls
    isOpen: boolean
    onClose: () => void
    title?: string
    
    // Data to filter
    data: any[]
    
    // Filter configuration
    filterFields: FilterField[]
    
    // Callbacks
    onFilterApply?: (filteredData: any[]) => void
    onFilterCountChange?: (count: number) => void
    
    // Event names for external communication
    filterChangeEvent?: string
    resetEvent?: string
}

export default function FilterModal({ 
    isOpen,
    onClose,
    title = 'فیلترها',
    data,
    filterFields,
    onFilterApply,
    onFilterCountChange,
    filterChangeEvent = 'filteredDataChanged',
    resetEvent = 'resetFilters'
}: FilterModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    const [filterValues, setFilterValues] = useState<Record<string, string>>({})
    const [fieldOptions, setFieldOptions] = useState<Record<string, any[]>>({})

    // Extract options from the data
    useEffect(() => {
        const options: Record<string, any[]> = {}
        filterFields.forEach(field => {
            if (field.options) {
                options[field.key] = field.options
            } else if (field.extractFrom && data.length > 0) {
                const unique = new Map()
                data.forEach((item: any) => {
                    const value = field.extractFrom!(item)
                    if (value && value.id && !unique.has(value.id)) {
                        unique.set(value.id, { id: value.id, name: value.name })
                    }
                })
                options[field.key] = Array.from(unique.values())
            } else {
                options[field.key] = []
            }
        })
        setFieldOptions(options)
    }, [data, filterFields])

    // Calculate active filter count
    const activeFilterCount = Object.values(filterValues).filter(Boolean).length

    // Notify parent of filter count whenever it changes
    useEffect(() => {
        if (onFilterCountChange) {
            onFilterCountChange(activeFilterCount)
        }
        window.dispatchEvent(new CustomEvent('filterCountChanged', { detail: activeFilterCount }))
    }, [activeFilterCount, onFilterCountChange])

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    // Listen for reset requests
    useEffect(() => {
        const handleResetRequest = () => clearFilters()
        window.addEventListener(resetEvent, handleResetRequest)
        return () => window.removeEventListener(resetEvent, handleResetRequest)
    }, [data])

    const clearFilters = () => {
        setFilterValues({})
        const filteredResult = [...data]
        window.dispatchEvent(new CustomEvent(filterChangeEvent, { detail: filteredResult }))
        if (onFilterApply) onFilterApply(filteredResult)
        onClose()
    }

    const updateFilterValue = (key: string, value: string) => {
        const newFilterValues = { ...filterValues, [key]: value }
        
        // Remove the filter if value is empty
        if (!value) {
            delete newFilterValues[key]
        }
        
        setFilterValues(newFilterValues)
        
        // Auto-apply filters when value changes
        let filteredResult = [...data]
        
        Object.entries(newFilterValues).forEach(([filterKey, filterValue]) => {
            if (!filterValue) return
            
            filteredResult = filteredResult.filter(item => {
                const itemValue = item[filterKey]
                return itemValue?.id === parseInt(filterValue) || itemValue === filterValue
            })
        })
        
        window.dispatchEvent(new CustomEvent(filterChangeEvent, { detail: filteredResult }))
        if (onFilterApply) onFilterApply(filteredResult)
    }

    const hasActiveFilters = activeFilterCount > 0

    if (!isOpen) return null

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal} ref={modalRef}>
                <div className={styles.modalHeader}>
                    <h3>{title}</h3>
                    <div className={styles.headerButtons}>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className={styles.clearHeaderBtn}>
                                <Icon icon={Icons.times} />
                                <span>حذف فیلترها</span>
                            </button>
                        )}
                        <button onClick={onClose} className={styles.closeButton}>
                            خروج
                        </button>
                    </div>
                </div>
                
                <div className={styles.modalContent}>
                    <div className={styles.filterContainer}>
                        {filterFields.map(field => (
                            <div key={field.key} className={styles.filterRow}>
                                <label className={styles.filterLabel}>{field.label}</label>
                                
                                <select
                                    value={filterValues[field.key] || ''}
                                    onChange={(e) => updateFilterValue(field.key, e.target.value)}
                                    className={styles.filterSelect}
                                >
                                    <option value="">همه</option>
                                    {(fieldOptions[field.key] || []).map(option => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}