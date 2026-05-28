// components/Spinner.tsx
'use client'

import { useEffect, useState } from 'react'
import styles from '../styles/spinner.module.css'

interface SpinnerProps {
    minDisplayTime?: number // Minimum time to show spinner in milliseconds
}

export default function Spinner({ minDisplayTime = 300 }: SpinnerProps) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
        }, minDisplayTime)

        return () => clearTimeout(timer)
    }, [minDisplayTime])

    return (
        <div className={`${styles.spinnerOverlay} ${!isVisible ? styles.fadeOut : ''}`}>
            <div className={styles.spinnerContainer}>
                <div className={styles.spinner}></div>
                <p className={styles.spinnerText}>در حال بارگذاری...</p>
            </div>
        </div>
    )
}