'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from '@/app/login/login.module.css'
import UserForm from '@/components/UserForm'
import { useApi } from '@/hooks/useApi'
import { usePopup } from '@/hooks/Popup'

function SignupContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const phone = searchParams.get('phone') || ''
    const [pendingRegistration, setPendingRegistration] = useState<{ courseId: number } | null>(null)
    const { showPopUp, PopupComponent } = usePopup()
    const { apiFetch } = useApi()


    useEffect(() => {
        // Check for pending registration after signup
        const pending = sessionStorage.getItem('pendingRegistrationAfterSignup')
        if (pending) {
            setPendingRegistration(JSON.parse(pending))
            console.log('Pending registration after signup:', JSON.parse(pending))
        }
    }, [])

    const registerForCourse = async (courseId: number): Promise<{ success: boolean; message?: string; code?: number }> => {
        try {
            const result = await apiFetch({
                url: 'api/registrations/',
                method: 'POST',
                body: {
                    course_id: courseId
                }
            })

            if (result.success) {
                return { success: true }
            } else {
                return {
                    success: false,
                    message: result.message,
                    code: result.code
                }
            }
        } catch (error) {
            console.error('Error registering for course:', error)
            return { success: false, message: 'خطا در ارتباط با سرور' }
        }
    }

    const getErrorMessage = (code?: number, defaultMessage?: string): string => {
        switch (code) {
            case 506:
                return 'این دوره تکمیل شده است'
            case 507:
                return 'این دوره در حال حاضر فعال نیست'
            case 508:
                return 'این دوره برای جنسیت شما مناسب نیست'
            case 509:
                return 'شما قبلاً در این دوره ثبت‌ نام کرده‌اید'
            case 510:
                return 'تداخل زمانی با دوره‌های دیگر شما وجود دارد'
            default:
                return defaultMessage || 'ثبت‌ نام در دوره با خطا مواجه شد'
        }
    }

    const handleSignupSuccess = async (user: any) => {
        console.log('Signup successful, user:', user)

        // Register for course if pending
        if (pendingRegistration) {
            const registrationResult = await registerForCourse(pendingRegistration.courseId)

            if (registrationResult.success) {
                // Clear pending registration
                sessionStorage.removeItem('pendingRegistrationAfterSignup')
                sessionStorage.removeItem('pendingRegistration')

                showPopUp({
                    title: 'ثبت‌ نام موفق',
                    message: 'شما با موفقیت در دوره ثبت‌ نام شدید.\nدر حال انتقال به صفحه دوره',
                    type: 'success',
                    duration: 0,
                    onClose: () => {
                        router.push(`/courses/${pendingRegistration.courseId}`)
                    },
                    onAutoClose: () => {
                        router.push(`/courses/${pendingRegistration.courseId}`)
                    }
                })
            } else {
                // Clear pending registration
                sessionStorage.removeItem('pendingRegistrationAfterSignup')
                sessionStorage.removeItem('pendingRegistration')

                const errorMessage = getErrorMessage(registrationResult.code, registrationResult.message)

                showPopUp({
                    title: 'خطا در ثبت‌ نام',
                    message: `${errorMessage}`,
                    type: 'error',
                    duration: 0,
                    onClose: () => {
                        router.push(`/courses/${pendingRegistration.courseId}`)
                    },
                    onAutoClose: () => {
                        router.push(`/courses/${pendingRegistration.courseId}`)
                    }
                })
            }
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