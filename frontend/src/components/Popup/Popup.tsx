// components/Popup/Popup.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { Icon, Icons } from '@/components/icon'
import styles from './Popup.module.css'

interface PopupProps {
    show: boolean
    title: string
    message: string | string[]
    duration?: number // milliseconds, 0 = no auto close
    type?: 'error' | 'warning' | 'info' | 'success'
    onClose?: () => void
    onAutoClose?: () => void
}

export default function Popup({
    show,
    title,
    message,
    duration = 5000,
    type = 'error',
    onClose,
    onAutoClose,
}: PopupProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)
    const [remainingSeconds, setRemainingSeconds] = useState(Math.ceil(duration / 1000))
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isClosingRef = useRef(false) // Prevent multiple closures

    useEffect(() => {
        if (show) {
            // Reset closing flag when showing
            isClosingRef.current = false
            setIsVisible(true)
            setIsLeaving(false)
            setRemainingSeconds(Math.ceil(duration / 1000))

            // Countdown timer
            if (duration > 0) {
                intervalRef.current = setInterval(() => {
                    setRemainingSeconds(prev => {
                        if (prev <= 1) {
                            return 0
                        }
                        return prev - 1
                    })
                }, 1000)

                // Auto close timer
                timeoutRef.current = setTimeout(() => {
                    if (!isClosingRef.current) {
                        isClosingRef.current = true
                        handleAutoClose()
                    }
                }, duration)
            }
        } else {
            // If show becomes false externally, clean up
            handleImmediateClose()
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [show, duration])

    const handleAutoClose = () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        
        setIsLeaving(true)
        setTimeout(() => {
            setIsVisible(false)
            // Call auto-close specific callback if provided
            if (onAutoClose) {
                onAutoClose()
            } else if (onClose) {
                onClose()
            }
        }, 150)
    }

    const handleManualClose = () => {
        if (isClosingRef.current) return // Prevent multiple calls
        isClosingRef.current = true
        
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        
        setIsLeaving(true)
        setTimeout(() => {
            setIsVisible(false)
            if (onClose) {
                onClose()
            }
        }, 150)
    }

    const handleImmediateClose = () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setIsVisible(false)
        setIsLeaving(false)
    }

    if (!isVisible) return null

    const typeStyles = {
        error: {
            icon: Icons.timesCircle,
            container: styles.errorContainer,
            iconBg: styles.errorIconBg,
            progressBar: styles.errorProgressBar,
        },
        warning: {
            icon: Icons.infoCircle,
            container: styles.warningContainer,
            iconBg: styles.warningIconBg,
            progressBar: styles.warningProgressBar,
        },
        info: {
            icon: Icons.infoCircle,
            container: styles.infoContainer,
            iconBg: styles.infoIconBg,
            progressBar: styles.infoProgressBar,
        },
        success: {
            icon: Icons.check,
            container: styles.successContainer,
            iconBg: styles.successIconBg,
            progressBar: styles.successProgressBar,
        },
    }

    const currentType = typeStyles[type]

    const renderMessage = () => {
        if (Array.isArray(message)) {
            return (
                <div className={styles.messageContainer}>
                    {message.map((line, index) => (
                        <p key={index} className={styles.messageLine}>
                            {line}
                        </p>
                    ))}
                </div>
            )
        } else {
            const lines = message.split('\n')
            if (lines.length > 1) {
                return (
                    <div className={styles.messageContainer}>
                        {lines.map((line, index) => (
                            <p key={index} className={styles.messageLine}>
                                {line}
                            </p>
                        ))}
                    </div>
                )
            }
            return <p className={styles.message}>{message}</p>
        }
    }

    return (
        <div className={`${styles.overlay} ${isLeaving ? styles.overlayExit : ''}`}>
            <div className={`${styles.card} ${currentType.container} ${isLeaving ? styles.cardExit : ''}`}>
                <div className={`${styles.iconCircle} ${currentType.iconBg}`}>
                    <Icon icon={currentType.icon} className={styles.icon} />
                </div>

                <h3 className={styles.title}>{title}</h3>
                {renderMessage()}

                {duration > 0 && (
                    <>
                        <div className={styles.progressContainer}>
                            <div 
                                className={`${styles.progressBar} ${currentType.progressBar}`}
                                style={{ animationDuration: `${duration}ms` }}
                            />
                        </div>
                        <p className={styles.timer}>
                            {remainingSeconds} ثانیه
                        </p>
                    </>
                )}

                <button onClick={handleManualClose} className={styles.closeButton}>
                    متوجه شدم
                </button>
            </div>
        </div>
    )
}