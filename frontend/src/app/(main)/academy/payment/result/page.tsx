// app/academy/payment/result/page.tsx
'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useApi } from '@/hooks/useApi'
import styles from './result.module.css'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

type PaymentStatus = 'loading' | 'success' | 'failed' | 'pending' | 'reversed' | 'cancelled'

function PaymentResultContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [status, setStatus] = useState<PaymentStatus>('loading')
    const [message, setMessage] = useState('')
    const [resNum, setResNum] = useState('')
    const [refNum, setRefNum] = useState('')
    const [enrollmentId, setEnrollmentId] = useState<number | null>(null)
    const [courseId, setCourseId] = useState<number | null>(null)
    const [paymentAmount, setPaymentAmount] = useState<number | null>(null)
    const { apiFetch } = useApi()

    useEffect(() => {
        const urlStatus = searchParams.get('status')
        const urlResNum = searchParams.get('res_num')
        const urlRefNum = searchParams.get('ref_num')
        const urlError = searchParams.get('error')
        const urlCourseId = searchParams.get('course_id')

        setResNum(urlResNum || '')
        setRefNum(urlRefNum || '')
        setCourseId(urlCourseId ? parseInt(urlCourseId) : null)

        // Error messages mapping
        const errorMessages: Record<string, string> = {
            'amount_mismatch': 'مبلغ پرداختی با مبلغ دوره مطابقت ندارد. لطفاً مجدداً تلاش کنید.',
            'payment_unsuccessful': 'پرداخت ناموفق بود. لطفاً مجدداً تلاش کنید.',
            'order_not_found': 'سفارش یافت نشد. لطفاً مجدداً تلاش کنید.',
            'already_processed': 'این پرداخت قبلاً پردازش شده است.',
            'already_reversed': 'این پرداخت برگشت خورده است.',
            'verification_failed': 'تأیید پرداخت با خطا مواجه شد. لطفاً با پشتیبانی تماس بگیرید.',
            'missing_parameters': 'اطلاعات پرداخت کامل نیست. لطفاً مجدداً تلاش کنید.',
            'payment_cancelled': 'پرداخت توسط شما لغو شد.',
            'already_enrolled': 'شما قبلاً در این دوره ثبت نام کرده‌اید.',
        }

        if (urlStatus === 'success' && urlResNum) {
            verifyPaymentStatus(urlResNum)
        } else if (urlStatus === 'failed') {
            setStatus('failed')
            setMessage(errorMessages[urlError || ''] || urlError || 'پرداخت ناموفق بود. لطفاً مجدداً تلاش کنید.')
        } else if (urlStatus === 'cancelled') {
            setStatus('cancelled')
            setMessage('پرداخت توسط شما لغو شد. در صورت تمایل می‌توانید مجدداً اقدام کنید.')
        } else {
            setStatus('failed')
            setMessage('اطلاعات پرداخت یافت نشد')
        }
    }, [searchParams])

    const verifyPaymentStatus = async (resNum: string) => {
        try {
            const result = await apiFetch({
                url: `/api/academy/payment/status/${resNum}/`,
                method: 'GET'
            })

            if (result.success && result.data) {
                const paymentStatus = result.data.status
                setPaymentAmount(result.data.amount)

                switch (paymentStatus) {
                    case 'PAID':
                        setStatus('success')
                        setMessage('پرداخت با موفقیت انجام شد و ثبت نام شما تکمیل گردید.')
                        setEnrollmentId(result.data.enrollment_id)
                        setRefNum(result.data.ref_num || refNum)
                        break
                    
                    case 'PENDING':
                        setStatus('pending')
                        setMessage('پرداخت در حال بررسی است. لطفاً چند لحظه صبر کنید...')
                        // Optional: Implement polling
                        break
                    
                    case 'FAILED':
                        setStatus('failed')
                        setMessage('پرداخت ناموفق بود. لطفاً مجدداً تلاش کنید.')
                        break
                    
                    case 'CANCELLED':
                        setStatus('cancelled')
                        setMessage('پرداخت توسط شما لغو شد.')
                        break
                    
                    case 'REVERSED':
                        setStatus('reversed')
                        setMessage('این پرداخت برگشت خورده است. لطفاً با پشتیبانی تماس بگیرید.')
                        break
                    
                    default:
                        setStatus('failed')
                        setMessage('وضعیت پرداخت نامشخص است. لطفاً با پشتیبانی تماس بگیرید.')
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

    // Handle polling for pending status
    useEffect(() => {
        let pollInterval: NodeJS.Timeout | null = null

        if (status === 'pending') {
            pollInterval = setInterval(() => {
                if (resNum) {
                    verifyPaymentStatus(resNum)
                }
            }, 5000) // Poll every 5 seconds
        }

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval)
            }
        }
    }, [status, resNum])

    if (status === 'loading') {
        return <LoadingSpinner />
    }

    // Get icon based on status
    const getIcon = () => {
        switch (status) {
            case 'success':
                return Icons.check
            case 'pending':
                return Icons.clock
            case 'cancelled':
                return Icons.timesCircle
            case 'reversed':
                return Icons.exclamationTriangle
            default:
                return Icons.timesCircle
        }
    }

    // Get title based on status
    const getTitle = () => {
        switch (status) {
            case 'success':
                return 'پرداخت موفق'
            case 'pending':
                return 'در حال بررسی'
            case 'cancelled':
                return 'پرداخت لغو شد'
            case 'reversed':
                return 'پرداخت برگشت خورد'
            default:
                return 'پرداخت ناموفق'
        }
    }

    // Get button config based on status
    const getButtonConfig = () => {
        switch (status) {
            case 'success':
                return {
                    primary: {
                        text: 'رفتن به دوره',
                        onClick: () => {
                            const storedCourseId = sessionStorage.getItem('academy_payment_course_id')
                            router.push(`/academy/courses/${storedCourseId || courseId || ''}`)
                        }
                    }
                }
            
            case 'pending':
                return {
                    primary: {
                        text: 'بررسی مجدد',
                        onClick: () => {
                            if (resNum) verifyPaymentStatus(resNum)
                        }
                    }
                }
            
            case 'cancelled':
                return {
                    primary: {
                        text: 'تلاش مجدد',
                        onClick: () => router.back()
                    }
                }
            
            default:
                return {
                    primary: {
                        text: 'تلاش مجدد',
                        onClick: () => router.back()
                    }
                }
        }
    }

    const buttonConfig = getButtonConfig()

    return (
        <>
            <div className={styles.contentWrapper}>
                <div className={`${styles.resultBox} ${styles[status + 'Box']}`}>
                    <div className={`${styles.icon} ${styles[status + 'Icon']}`}>
                        <Icon icon={getIcon()} />
                    </div>

                    <h1 className={`${styles.title} ${styles[status + 'Title']}`}>
                        {getTitle()}
                    </h1>

                    <p className={styles.message}>{message}</p>

                    {status === 'success' && (
                        <div className={styles.details}>
                            <div className={styles.detailRow}>
                                <span>شماره پیگیری:</span>
                                <span>{refNum || '---'}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>شماره سفارش:</span>
                                <span>{resNum}</span>
                            </div>
                            {paymentAmount && (
                                <div className={styles.detailRow}>
                                    <span>مبلغ پرداختی:</span>
                                    <span>{paymentAmount.toLocaleString()} تومان</span>
                                </div>
                            )}
                            {enrollmentId && (
                                <div className={styles.detailRow}>
                                    <span>شماره ثبت نام:</span>
                                    <span>{enrollmentId}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'pending' && (
                        <div className={styles.pendingInfo}>
                            <div className={styles.spinner}></div>
                            <p>در حال انتظار برای تأیید پرداخت...</p>
                        </div>
                    )}

                    <div className={styles.buttons}>
                        <button
                            onClick={buttonConfig.primary.onClick}
                            className={`${styles.primaryButton} ${status === 'pending' ? styles.pendingButton : ''}`}
                        >
                            {buttonConfig.primary.text}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default function AcademyPaymentResultPage() {
    return (
        <div className={styles.pageContainer}>
            <Suspense fallback={<LoadingSpinner />}>
                <PaymentResultContent />
            </Suspense>
        </div>
    )
}