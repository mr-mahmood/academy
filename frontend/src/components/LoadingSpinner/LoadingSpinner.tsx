// components/LoadingSpinner/LoadingSpinner.tsx
'use client'

import styles from './LoadingSpinner.module.css'

interface LoadingSpinnerProps {
    message?: string | false
    size?: 'small' | 'medium' | 'large'
    fullPage?: boolean
}

export default function LoadingSpinner({ 
    message = 'در حال بارگذاری...', 
    size = 'medium',
    fullPage = false 
}: LoadingSpinnerProps) {
    const sizeMap = {
        small: {
            spinner: 24,
            messageSize: '0.75rem'
        },
        medium: {
            spinner: 40,
            messageSize: '0.875rem'
        },
        large: {
            spinner: 56,
            messageSize: '1rem'
        }
    }

    const currentSize = sizeMap[size]

    if (fullPage) {
        return (
            <div className={styles.fullPageContainer}>
                <div className={styles.loadingWrapper}>
                    <div 
                        className={styles.spinner} 
                        style={{ width: currentSize.spinner, height: currentSize.spinner }}
                    ></div>
                    {message && <p className={styles.message} style={{ fontSize: currentSize.messageSize }}>{message}</p>}
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.loadingWrapper}>
                <div 
                    className={styles.spinner} 
                    style={{ width: currentSize.spinner, height: currentSize.spinner }}
                ></div>
                {message && <p className={styles.message} style={{ fontSize: currentSize.messageSize }}>{message}</p>}
            </div>
        </div>
    )
}