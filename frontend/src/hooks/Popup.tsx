// hooks/usePopup.ts
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Popup from '@/components/Popup/Popup'

export interface PopupConfig {
    title: string
    message: string | string[]
    duration?: number
    type?: 'error' | 'warning' | 'info' | 'success'
    onClose?: () => void
    onAutoClose?: () => void
}

// Global event for non-React usage
let globalShowPopup: ((config: PopupConfig) => void) | null = null

export function usePopup() {
    const [popup, setPopup] = useState<PopupConfig | null>(null)
    const [showPopup, setShowPopup] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const showPopUp = useCallback((config: PopupConfig) => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        
        setPopup(config)
        setShowPopup(true)
    }, [])

    const hidePopup = useCallback(() => {
        setShowPopup(false)
        
        // Call onClose callback if exists
        if (popup?.onClose) {
            popup.onClose()
        }
        
        // Clear popup after animation
        timeoutRef.current = setTimeout(() => {
            setPopup(null)
        }, 300)
    }, [popup])

    const handleAutoClose = useCallback(() => {
        setShowPopup(false)
        
        // Call onAutoClose callback if exists
        if (popup?.onAutoClose) {
            popup.onAutoClose()
        } else if (popup?.onClose) {
            popup.onClose()
        }
        
        // Clear popup after animation
        timeoutRef.current = setTimeout(() => {
            setPopup(null)
        }, 300)
    }, [popup])

    // Expose showPopUp globally for non-React usage
    useEffect(() => {
        globalShowPopup = showPopUp
        
        return () => {
            globalShowPopup = null
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [showPopUp])

    const PopupComponent = popup ? (
        <Popup
            show={showPopup}
            title={popup.title}
            message={popup.message}
            duration={popup.duration}
            type={popup.type || 'error'}
            onClose={hidePopup}
            onAutoClose={handleAutoClose}
        />
    ) : null

    return {
        showPopUp,
        hidePopup,
        PopupComponent
    }
}

// Helper function for non-React code (like robustFetch)
export function showGlobalPopup(config: PopupConfig) {
    if (globalShowPopup) {
        globalShowPopup(config)
    } else {
        // Fallback: Store popup for when hook is ready
        if (typeof window !== 'undefined') {
            (window as any).__pendingPopup = config
        }
    }
}

// Initialize global popup listener for components that mount after
if (typeof window !== 'undefined') {
    window.addEventListener('popupReady', () => {
        const pending = (window as any).__pendingPopup
        if (pending && globalShowPopup) {
            globalShowPopup(pending)
            delete (window as any).__pendingPopup
        }
    })
}