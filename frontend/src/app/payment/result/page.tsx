// app/payment/result/page.tsx
'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useApi } from '@/hooks/useApi'
import styles from './result.module.css'
import Header from '@/components/Header/Header'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

// Separate component that uses useSearchParams
function PaymentResultContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
    const [message, setMessage] = useState('')
    const [resNum, setResNum] = useState('')
    const [refNum, setRefNum] = useState('')
    const [EnrollmentId, setEnrollmentId] = useState<number | null>(null)
    const [countdown, setCountdown] = useState(5)
    const { apiFetch } = useApi() 

    useEffect(() => {
        // Get parameters from URL
        const urlStatus = searchParams.get('status')
        const urlResNum = searchParams.get('res_num')
        const urlRefNum = searchParams.get('ref_num')
        const urlError = searchParams.get('error')

        setResNum(urlResNum || '')
        setRefNum(urlRefNum || '')

        if (urlStatus === 'success' && urlResNum) {
            // Payment successful - verify with backend
            verifyPaymentStatus(urlResNum)
        } else if (urlStatus === 'failed') {
            setStatus('failed')
            setMessage(urlError || 'پرداخت ناموفق بود. لطفاً مجدداً تلاش کنید.')
        } else {
            // No status - maybe direct access
            setStatus('failed')
            setMessage('اطلاعات پرداخت یافت نشد')
        }
    }, [searchParams])

    const verifyPaymentStatus = async (resNum: string) => {
        try {
            const result = await apiFetch({
                url: `api/academy/payment/status/${resNum}/`,
                method: 'GET'
            })

            if (result.success && result.data) {
                if (result.data.status === 'PAID') {
                    setStatus('success')
                    setMessage('پرداخت با موفقیت انجام شد و ثبت نام شما تکمیل گردید.')
                    setEnrollmentId(result.data.enrollment_id)

                    // Get the course ID from sessionStorage
                    const courseId = sessionStorage.getItem('payment_course_id')

                    // Auto redirect back to the course page after 5 seconds
                    const interval = setInterval(() => {
                        setCountdown(prev => {
                            if (prev <= 1) {
                                clearInterval(interval)
                                if (courseId) {
                                    router.push(`/courses/${courseId}`)
                                } else {
                                    router.push('/dashboard')
                                }
                                return 0
                            }
                            return prev - 1
                        })
                    }, 1000)

                    return () => clearInterval(interval)
                } else {
                    setStatus('failed')
                    setMessage('پرداخت تأیید نشد. لطفاً با پشتیبانی تماس بگیرید.')
                }
            } else {
                setStatus('failed')
                setMessage('خطا در تأیید پرداخت')
            }
        } catch (error) {
            console.error('Error verifying payment:', error)
            setStatus('failed')
            setMessage('خطا در ارتباط با سرور')
        }
    }

    if (status === 'loading') {
        return <LoadingSpinner />
    }

    return (
        <>
            <div className={styles.contentWrapper}>
                <div className={`${styles.resultBox} ${status === 'success' ? styles.successBox : styles.failedBox}`}>
                    <div className={styles.icon}>
                        {status === 'success' ? (
                            <Icon icon={Icons.check} />
                        ) : (
                            <Icon icon={Icons.timesCircle} />
                        )}
                    </div>

                    <h1 className={styles.title}>
                        {status === 'success' ? 'پرداخت موفق' : 'پرداخت ناموفق'}
                    </h1>

                    <p className={styles.message}>{message}</p>

                    {status === 'success' && EnrollmentId && (
                        <div className={styles.details}>
                            <div className={styles.detailRow}>
                                <span>شماره پیگیری:</span>
                                <span>{refNum || '---'}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>شماره سفارش:</span>
                                <span>{resNum}</span>
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <p className={styles.countdown}>
                            در حال انتقال به داشبورد در {countdown} ثانیه...
                        </p>
                    )}

                    <div className={styles.buttons}>
                        {status === 'success' ? (
                            <button
                                onClick={() => {
                                    const courseId = sessionStorage.getItem('payment_course_id')
                                    if (courseId) {
                                        router.push(`/courses/${courseId}`)
                                    } else {
                                        router.push('/dashboard')
                                    }
                                }}
                                className={styles.primaryButton}
                            >
                                رفتن به دوره
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => router.back()}
                                    className={styles.primaryButton}
                                >
                                    بازگشت و تلاش مجدد
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className={styles.secondaryButton}
                                >
                                    رفتن به داشبورد
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

// Main component with Suspense boundary
export default function PaymentResultPage() {
    return (
        <div className={styles.pageContainer}>
            <Suspense fallback={<LoadingSpinner />}>
                <PaymentResultContent />
            </Suspense>
        </div>
    )
}