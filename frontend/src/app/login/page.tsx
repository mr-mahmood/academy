'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './login.module.css'
import { useActiveUser } from '@/contexts/active_user_context'
import { usePopup } from '@/hooks/Popup'
import { useApi } from '@/hooks/useApi'
import Spinner from '@/components/Spinner/Spinner';
import { useAutoReadOtp } from '@/hooks/useAutoReadOtp';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

// Main component that uses useSearchParams
function AuthPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { setActiveUser } = useActiveUser()
    const [step, setStep] = useState<'phone' | 'otp'>('phone')
    const [phone, setPhone] = useState<string>('')
    const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
    const [timer, setTimer] = useState<number>(300)
    const [error, setError] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [redirecting, setRedirecting] = useState<boolean>(false)
    const [isNewUser, setIsNewUser] = useState<boolean>(false)
    const [otpVerificationStatus, setOtpVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')
    const [phoneVerificationStatus, setPhoneVerificationStatus] = useState<'idle' | 'verifying' | 'error'>('idle')
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const { showPopUp, PopupComponent } = usePopup()
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const hasShownPopup = useRef(false)
    const { apiFetch } = useApi() 
    const showReloginPopup = searchParams.get('popup') === 'show'

    // Get pending registration from sessionStorage
    const pendingRegistration = typeof window !== 'undefined' 
        ? JSON.parse(sessionStorage.getItem('pendingRegistration') || 'null')
        : null

    useEffect(() => {
        setStep('phone')

        if (showReloginPopup && !hasShownPopup.current) {
            hasShownPopup.current = true
            showPopUp({
                title: 'نیاز به ورود',
                message: 'برای مشاهده بخش انتخاب شده وارد حساب خود شوید',
                type: 'warning',
                duration: 5000,
            })
        }
    }, [showReloginPopup, showPopUp])

    // Timer countdown
    useEffect(() => {
        if (timer <= 0) return
        const interval = setInterval(() => setTimer(prev => prev - 1), 1000)
        return () => clearInterval(interval)
    }, [timer])

    // Auto-focus first input when OTP step loads
    useEffect(() => {
        if (step === 'otp') {
            setTimeout(() => inputRefs.current[0]?.focus(), 100)
        }
        setOtpVerificationStatus('idle')
    }, [step])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 11)
        setPhone(value)
        setError('')
        setPhoneVerificationStatus('idle')
    }

    // Send OTP Request to Backend
    const sendOtpRequest = async (phoneNumber: string): Promise<boolean> => {
        try {
            const result = await apiFetch({
                url: 'api/auth/request-otp/',
                method: 'POST',
                body: { phone: phoneNumber }
            })

            if (result.success) {
                sessionStorage.setItem('userPhone', phoneNumber)
                setIsNewUser(result.data?.new_user ?? false)
                return true
            } else {
                if (result.code === 100) {
                    setError('شماره موبایل معتبر نیست')
                    setPhoneVerificationStatus('error')
                    timeoutRef.current = setTimeout(() => {
                        setPhoneVerificationStatus('idle')
                    }, 2000)
                } else if (result.code === 65) {
                    let timeLeft = Math.floor(Number(result.data.remaining_seconds) / 60);
                    setError('تلاش ناموفق زیاد')
                    setPhoneVerificationStatus('error')
                    showPopUp({
                        title: 'تلاش ناموفق زیاد',
                        message: `اکانت شما به طور موقت مسدود شده است\n لطفا ${timeLeft} دقیقه دیگر دوباره تلاش کنید`,
                        type: 'error',
                        duration: 5000
                    })
                    timeoutRef.current = setTimeout(() => {
                        setPhoneVerificationStatus('idle')
                    }, 2000)
                } else {
                    setError('خطا در ارسال کد')
                    setPhoneVerificationStatus('error')
                    showPopUp({
                        title: 'خطا',
                        message: 'خطا در ارسال کد تأیید',
                        type: 'error',
                        duration: 5000
                    })
                    timeoutRef.current = setTimeout(() => {
                        setPhoneVerificationStatus('idle')
                    }, 2000)
                }
                return false
            }
        } catch (error) {
            console.error('Error sending OTP:', error)
            setError('خطا در ارتباط با سرور')
            setPhoneVerificationStatus('error')
            showPopUp({
                title: 'خطای ارتباط',
                message: 'خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.',
                type: 'error',
                duration: 5000
            })
            timeoutRef.current = setTimeout(() => {
                setPhoneVerificationStatus('idle')
            }, 2000)
            return false
        }
    }

    const handlePhoneSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (phone.length !== 11 || !phone.startsWith('09')) {
            setError('شماره موبایل معتبر نیست (مثال: 09123456789)')
            setPhoneVerificationStatus('error')
            timeoutRef.current = setTimeout(() => {
                setPhoneVerificationStatus('idle')
            }, 2000)
            return
        }

        setLoading(true)
        setPhoneVerificationStatus('verifying')
        setError('')

        const success = await sendOtpRequest(phone)

        if (success) {
            setStep('otp')
            setTimer(300)
            setDigits(['', '', '', '', '', ''])
            setPhoneVerificationStatus('idle')
        }

        setLoading(false)
    }

    // Resend OTP function
    const handleResendOtp = async () => {
        if (timer > 0 || loading) return

        setLoading(true)
        setError('')

        const userPhone = sessionStorage.getItem('userPhone') || phone

        const success = await sendOtpRequest(userPhone)

        if (success) {
            setTimer(300)
            setDigits(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        }

        setLoading(false)
    }

    // Verify OTP with Backend
    const verifyOtpRequest = async (phoneNumber: string, otpCode: string): Promise<boolean> => {
        try {
            const result = await apiFetch({
                url: 'api/auth/verify-otp/',
                method: 'POST',
                body: {
                    phone: phoneNumber,
                    otp: otpCode,
                }
            })

            if (result.success) {
                const data = result.data

                if (isNewUser) {
                    if (pendingRegistration) {
                        sessionStorage.setItem('pendingRegistrationAfterSignup', JSON.stringify(pendingRegistration))
                    }

                    setTimeout(() => {
                        showPopUp({
                            title: 'تکمیل ثبت‌ نام',
                            message: 'در حال انتقال به صفحه تکمیل ثبت نام',
                            type: 'info',
                            duration: 5000,
                            onClose: () => {
                                setRedirecting(true)
                                router.push(`/signup?phone=${data?.phone_number || phoneNumber}`)
                            },
                            onAutoClose: () => {
                                setRedirecting(true)
                                router.push(`/signup?phone=${data?.phone_number || phoneNumber}`)
                            }
                        })
                    }, 1000)
                    return true
                } else if (data?.user) {
                    setActiveUser(data.user)

                    // Check for pending registration and redirect to course detail page
                    if (pendingRegistration) {
                        // Just redirect to the course page - user will register manually
                        const redirectUrl = `/${pendingRegistration.parent}/courses/${pendingRegistration.courseId}`
                        
                        showPopUp({
                            title: 'ورود موفق',
                            message: 'شما با موفقیت وارد شدید',
                            type: 'success',
                            duration: 0,
                            onClose: () => {
                                setRedirecting(true)
                                router.push(redirectUrl)
                            }
                        })
                    } else {
                        setRedirecting(true)
                        setTimeout(() => {
                            router.push('/')
                        }, 1000)
                    }
                    return true
                }
                return false
            } else {
                if (result.code === 60) {
                    setError('مدت اعتبار کد تمام شده است. لطفاً دوباره درخواست کنید')
                } else if (result.code === 61) {
                    setError('کد وارد شده اشتباه است')
                } else if (result.code === 65) {
                    let timeLeft = Math.floor(Number(result.data.remaining_seconds) / 60);
                    setError('تلاش ناموفق بیش از حد')
                    setTimeout(() => {
                        showPopUp({
                            title: 'تلاش ناموفق زیاد',
                            message: `اکانت شما به طور موقت مسدود شده است\n لطفا ${timeLeft} دقیقه دیگر دوباره تلاش کنید`,
                            type: 'error',
                            duration: 5000
                        })
                    }, 1000)
                } else {
                    setError('خطا در تأیید کد')
                }
                return false
            }
        } catch (error) {
            console.error('Error verifying OTP:', error)
            setError('خطا در ارتباط با سرور')
            return false
        }
    }

    const handleDigitChange = (index: number, value: string) => {
        const newValue = value.replace(/\D/g, '').slice(-1)
        const newDigits = [...digits]
        newDigits[index] = newValue
        setDigits(newDigits)
        setError('')

        if (otpVerificationStatus !== 'idle') {
            setOtpVerificationStatus('idle')
        }

        if (newValue && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }

        if (index === 5 && newValue && !loading) {
            const code = newDigits.join('')
            verifyCode(code)
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const verifyCode = async (code: string) => {
        setLoading(true)

        const userPhone = sessionStorage.getItem('userPhone')

        if (!userPhone) {
            setError('خطا در اطلاعات کاربری')
            setOtpVerificationStatus('error')
            showPopUp({
                title: 'خطا',
                message: 'خطا در اطلاعات کاربری. لطفاً دوباره تلاش کنید.',
                type: 'error',
                duration: 4000
            })
            setLoading(false)

            timeoutRef.current = setTimeout(() => {
                setError('')
                setOtpVerificationStatus('idle')
            }, 2000)
            return
        }

        const success = await verifyOtpRequest(userPhone, code)

        if (success) {
            setOtpVerificationStatus('success')
        } else {
            setOtpVerificationStatus('error')
            timeoutRef.current = setTimeout(() => {
                setDigits(['', '', '', '', '', ''])
                setError('')
                setOtpVerificationStatus('idle')
                inputRefs.current[0]?.focus()
            }, 1500)
        }

        setLoading(false)
    }

    useAutoReadOtp((code: string) => {
        if (step === 'otp' && code.length === 6) {
            const digitsArray = code.split('');
            setDigits(digitsArray);
            verifyCode(code);
        }
    });

    const formatTime = (seconds: number): string => {
        return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    }

    return (
        <>
            <div className={styles.formContainer}>
                {/* Phone Step */}
                {step === 'phone' && (
                    <div className={styles.stepContainer}>
                        <div className={styles.welcomeSection}>
                            <h2 className={styles.welcomeTitle}>خوش آمدید</h2>
                            <p className={styles.welcomeText}>
                                شماره موبایل خود را وارد کنید تا وارد شوید یا ثبت‌نام کنید
                            </p>
                        </div>

                        <form onSubmit={handlePhoneSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>شماره موبایل</label>
                                <div className={styles.inputWrapper}>
                                    <span className={styles.inputIcon}>📱</span>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={11}
                                        dir="ltr"
                                        className={`
                                            ${styles.phoneInput} 
                                            ${error ? styles.inputError : ''}
                                            ${phoneVerificationStatus === 'error' ? styles.phoneInputError : ''}
                                            ${phoneVerificationStatus === 'verifying' ? styles.phoneInputVerifying : ''}
                                        `}
                                        placeholder="09XX XXX XXXX"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        disabled={loading}
                                    />
                                </div>
                                {error && <p className={styles.errorMessage}>{error}</p>}
                            </div>

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span>در حال ارسال</span>
                                        <Spinner />
                                    </>
                                ) : (
                                    <span>ورود</span>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* OTP Step */}
                {step === 'otp' && (
                    <div className={styles.stepContainer}>
                        <h2 className={styles.title}>تأیید هویت</h2>

                        <p className={styles.subtitle}>
                            کد ۶ رقمی ارسال‌شده به شماره {sessionStorage.getItem('userPhone') || phone} را وارد کنید
                            {error && <p className={styles.errorMessage}>{error}</p>}
                        </p>

                        <div className={styles.otpInputs} dir="ltr">
                            {digits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el }}
                                    autoComplete="one-time-code"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleDigitChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    disabled={loading || otpVerificationStatus === 'success' || otpVerificationStatus === 'verifying'}
                                    className={`
                                        ${styles.otpInput} 
                                        ${error ? styles.inputError : ''} 
                                        ${digit ? styles.filled : ''}
                                        ${otpVerificationStatus === 'success' ? styles.otpInputSuccess : ''}
                                        ${otpVerificationStatus === 'error' ? styles.otpInputError : ''}
                                        ${otpVerificationStatus === 'verifying' ? styles.otpInputVerifying : ''}
                                    `}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => verifyCode(digits.join(''))}
                            disabled={loading || digits.join('').length !== 6 || otpVerificationStatus === 'success' || redirecting}
                            className={`
                                ${styles.verifyButton}
                                ${otpVerificationStatus === 'verifying' ? styles.verifyButtonLoading : ''}
                                ${otpVerificationStatus === 'success' ? styles.verifyButtonSuccess : ''}
                                ${otpVerificationStatus === 'error' ? styles.verifyButtonError : ''}
                            `}
                        >
                            {loading ? (
                                <>
                                    <span>در حال بررسی</span>
                                    <Spinner />
                                </>
                            ) : otpVerificationStatus === 'success' ? (
                                '✓ تأیید شد'
                            ) : redirecting ? (
                                <>
                                    <span>در حال انتقال</span>
                                    <Spinner />
                                </>
                            ) : (
                                'تأیید و ورود'
                            )}
                        </button>

                        <div className={styles.resendSection}>
                            <p className={styles.resendText}>کد را دریافت نکردید؟ {' '}
                                <button
                                    onClick={handleResendOtp}
                                    disabled={timer > 0 || loading}
                                    className={`${styles.resendButton} ${timer === 0 && !loading ? styles.active : ''}`}
                                >
                                    ارسال مجدد کد
                                </button>
                            </p>
                            <div className={styles.timerContainer}>
                                <span className={styles.timerIcon}>⏱️</span>
                                <span className={styles.timer}>{formatTime(timer)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {PopupComponent}
        </>
    )
}

// Main export with Suspense boundary
export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AuthPageContent />
        </Suspense>
    )
}