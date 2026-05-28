// components/AuthGuard.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveUser } from '@/contexts/active_user_context'

interface AuthGuardProps {
    children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter()
    const { activeUser, isLoadingActiveUser, isAuthenticated } = useActiveUser()
    const [mounted, setMounted] = useState(false)
    const [isRedirecting, setIsRedirecting] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && !isLoadingActiveUser && !isAuthenticated && !activeUser && !isRedirecting) {
            setIsRedirecting(true)

            // Redirect to login with query parameter
            router.replace('/login?popup=show')
        }
    }, [mounted, isLoadingActiveUser, isAuthenticated, activeUser, router, isRedirecting])

    // Don't render anything until we confirm authentication
    if (!mounted || isLoadingActiveUser) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                width: '100%',
                position: 'fixed',
                top: 0,
                left: 0,
                background: 'var(--bg-primary)',
                zIndex: 100,
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: '3px solid var(--border-color)',
                    borderTopColor: 'var(--accent-color)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        )
    }

    // Not authenticated - show nothing (redirecting)
    if (!isAuthenticated || !activeUser) {
        return null
    }

    // User is authenticated, show children
    return <>{children}</>
}