'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from '@/app/(auth)/login/login.module.css'
import UserForm from '@/components/UserForm'
import { usePopup } from '@/hooks/Popup'

function SignupContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const phone = searchParams.get('phone') || ''
    const [pendingRegistration, setPendingRegistration] = useState<{ courseId: number; parent: string } | null>(null)
    const { showPopUp, PopupComponent } = usePopup()

    useEffect(() => {
        // Check for pending registration after signup
        const pending = sessionStorage.getItem('pendingRegistrationAfterSignup')
        if (pending) {
            setPendingRegistration(JSON.parse(pending))
            console.log('Pending registration after signup:', JSON.parse(pending))
        }
    }, [])

    const handleSignupSuccess = async (user: any) => {
        console.log('Signup successful, user:', user)

        // Check for pending registration and redirect to course page
        if (pendingRegistration) {
            // Clear pending registration
            sessionStorage.removeItem('pendingRegistrationAfterSignup')
            sessionStorage.removeItem('pendingRegistration')

            const redirectUrl = `/${pendingRegistration.parent}/courses/${pendingRegistration.courseId}`

            showPopUp({
                title: 'ثبت‌ نام موفق',
                message: 'حساب کاربری شما با موفقیت ایجاد شد.\nدر حال انتقال به صفحه دوره',
                type: 'success',
                duration: 0,
                onClose: () => {
                    router.push(redirectUrl)
                },
                onAutoClose: () => {
                    router.push(redirectUrl)
                }
            })
        } else {
            showPopUp({
                title: 'ثبت‌ نام موفق',
                message: 'حساب کاربری شما با موفقیت ایجاد شد.\nدر حال انتقال به داشبورد',
                type: 'success',
                duration: 5000,
                onClose: () => {
                    router.push('/dashboard')
                },
                onAutoClose: () => {
                    router.push('/dashboard')
                }
            })
        }
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.formContainer}>
                <UserForm
                    mode="signup"
                    initialPhoneNumber={phone}
                    onSuccess={handleSignupSuccess}
                />
            </div>
            {PopupComponent}
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupContent />
        </Suspense>
    )
}