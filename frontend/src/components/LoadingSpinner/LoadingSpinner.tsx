'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './LoadingSpinner.module.css'

interface LoadingSpinnerProps {
    message?: string | false
    size?: 'small' | 'medium' | 'large'
    fullPage?: boolean
    minDisplayTime?: number // Minimum time to show spinner in ms
}

export default function LoadingSpinner({ 
    message = 'در حال بارگذاری...', 
    size = 'large',
    fullPage = false,
    minDisplayTime = 800
}: LoadingSpinnerProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [shouldRender, setShouldRender] = useState(true)
    const startTimeRef = useRef<number>(Date.now())
    const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)

    const sizeMap = {
        small: {
            spinner: 32,
            messageSize: '0.75rem',
            borderWidth: '3px'
        },
        medium: {
            spinner: 48,
            messageSize: '0.875rem',
            borderWidth: '4px'
        },
        large: {
            spinner: 64,
            messageSize: '1rem',
            borderWidth: '5px'
        }
    }

    const currentSize = sizeMap[size]

    // Handle fade in after mount
    useEffect(() => {
        // Trigger fade in after a tiny delay
        const fadeInTimer = setTimeout(() => {
            setIsVisible(true)
        }, 10)

        return () => clearTimeout(fadeInTimer)
    }, [])

    // Handle minimum display time and fade out on unmount
    useEffect(() => {
        return () => {
            const elapsedTime = Date.now() - startTimeRef.current
            const remainingTime = Math.max(0, minDisplayTime - elapsedTime)
            
            // Start fade out
            setIsVisible(false)
            
            // Clear any existing timer
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
            
            // Wait for fade out animation + remaining time before removing
            timerRef.current = setTimeout(() => {
                setShouldRender(false)
            }, remainingTime + 300)
        }
    }, [minDisplayTime])

    if (!shouldRender) {
        return null
    }

    const spinnerContent = (
        <div className={`${styles.loadingWrapper} ${isVisible ? styles.visible : ''}`}>
            <div className={styles.spinnerContainer}>
                <div 
                    className={`${styles.spinner} ${styles[size]}`}
                    style={{ 
                        width: currentSize.spinner, 
                        height: currentSize.spinner,
                        borderWidth: currentSize.borderWidth
                    }}
                >
                    <div className={styles.spinnerInner}></div>
                </div>
                <div 
                    className={styles.pulseRing}
                    style={{ 
                        width: currentSize.spinner + 20, 
                        height: currentSize.spinner + 20 
                    }}
                ></div>
            </div>
            {message && (
                <p className={styles.message} style={{ fontSize: currentSize.messageSize }}>
                    {message}
                </p>
            )}
        </div>
    )

    if (fullPage) {
        return (
            <div className={styles.fullPageContainer}>
                {spinnerContent}
            </div>
        )
    }

    return (
        <div className={styles.container}>
            {spinnerContent}
        </div>
    )
}