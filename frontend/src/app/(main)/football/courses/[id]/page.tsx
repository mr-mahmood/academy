'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useActiveUser } from '@/contexts/active_user_context'
import { useApi } from '@/hooks/useApi'
import type { FootballTest } from '@/types/FootballTest'
import type { FootballEnrollment } from '@/types/FootballEnrollment'
import styles from './footballTestDetail.module.css'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

interface PaymentInitiateResponse {
    success: boolean
    data?: {
        track_id: number
        gateway_url: string
        payment_id: number
        enrollment_id: number
        res_num: string
        amount: number
    }
    message?: string
    code?: number
}

export default function FootballTestDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { activeUser, isLoadingActiveUser } = useActiveUser()
    const { apiFetch } = useApi()
    const [test, setTest] = useState<FootballTest | null>(null)
    const [enrollment, setEnrollment] = useState<FootballEnrollment | null>(null)
    const [userEnrollments, setUserEnrollments] = useState<FootballEnrollment[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [cancelProcessing, setCancelProcessing] = useState(false)
    const [paymentProcessing, setPaymentProcessing] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showModal, setShowModal] = useState<'preRegister' | 'pay' | 'cancel' | null>(null)

    const testId = params.id as string

    const isValidId = testId && testId !== 'undefined'

    useEffect(() => {
        if (!isValidId) {
            router.replace('/football-test/courses')
        }
    }, [isValidId, router])

    // Fetch user enrollments
    useEffect(() => {
        if (!activeUser || !isValidId) return
        const fetchEnrollments = async () => {
            const result = await apiFetch({ url: 'api/football/enrollment/', method: 'GET' })
            if (result.success) {
                const data = result.data?.enrollments || result.data || []
                setUserEnrollments(Array.isArray(data) ? data : [])
            }
        }
        fetchEnrollments()
    }, [activeUser, isValidId])

    // Fetch test details
    useEffect(() => {
        if (!isValidId) return

        const fetchTest = async () => {
            setLoading(true)
            try {
                const result = await apiFetch({ url: `api/football/courses/${testId}/`, method: 'GET' })
                if (result.success) {
                    setTest(result.data?.course || result.data)
                } else {
                    setError('تست مورد نظر یافت نشد')
                }
            } catch (err) {
                setError('خطا در بارگذاری اطلاعات تست')
            } finally {
                setLoading(false)
            }
        }
        fetchTest()
    }, [testId, isValidId])

    // Sync enrollment state
    useEffect(() => {
        if (!test) return
        if (userEnrollments.length > 0) {
            const found = userEnrollments.find(e => e.course?.id === test.id) || null
            setEnrollment(found)
        } else {
            setEnrollment(null)
        }
    }, [userEnrollments, test])

    const hasTimeConflict = (): boolean => {
        if (!test?.test_date || !test?.start_time || !test?.end_time) return false
        return userEnrollments.some(e => {
            const ec = e.course
            if (!ec || ec.id === test.id) return false
            return ec.test_date === test.test_date &&
                ec.start_time < test.end_time &&
                ec.end_time > test.start_time
        })
    }

    const isEnrolled = enrollment?.enrollment_status === 'CONFIRMED'
    const isPreRegistered = ['WAITING_FOR_PAYMENT', 'PENDING'].includes(enrollment?.enrollment_status || '')

    const canPreRegister = (): boolean => {
        if (!test || !activeUser) return false
        if (test.status !== 'ACTIVE') return false
        if (isEnrolled || isPreRegistered) return false
        if (test.gender_requirement && test.gender_requirement !== activeUser.gender) return false
        if (hasTimeConflict()) return false
        return true
    }

    const getDisableReason = (): string | null => {
        if (!test || !activeUser) return null
        if (isEnrolled) return 'شما قبلاً در این تست ثبت‌نام کرده‌اید'
        if (isPreRegistered) return 'پیش‌ ثبت‌ نام انجام شده است. برای تکمیل، پرداخت را انجام دهید'
        if (test.status !== 'ACTIVE') return 'این تست در حال حاضر فعال نیست'
        if (test.gender_requirement && test.gender_requirement !== activeUser.gender) return 'این تست برای جنسیت شما مناسب نیست'
        if (hasTimeConflict()) return 'تداخل زمانی با تست‌های دیگر شما وجود دارد'
        return null
    }

    const refreshEnrollments = async () => {
        const result = await apiFetch({ url: 'api/football/enrollment/', method: 'GET' })
        if (result.success) {
            const data = result.data?.enrollments || result.data || []
            setUserEnrollments(Array.isArray(data) ? data : [])
        }
    }

    const handlePreRegister = async () => {
        if (!activeUser || !test) return
        setShowModal(null)
        setProcessing(true)
        setError('')

        try {
            const result = await apiFetch({
                url: 'api/football/enrollment/',
                method: 'POST',
                body: { course_id: test.id }
            })
            if (result.success) {
                setSuccess('پیش‌ ثبت‌ نام با موفقیت انجام شد')
                await refreshEnrollments()
                setTimeout(() => setSuccess(''), 3000)
            } else {
                setError(result.message || 'خطا در پیش‌ ثبت‌ نام')
                setTimeout(() => setError(''), 4000)
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور')
            setTimeout(() => setError(''), 4000)
        } finally {
            setProcessing(false)
        }
    }

    const handlePayment = async () => {
        if (!activeUser || !test || !enrollment) return
        setShowModal(null)
        setPaymentProcessing(true)

        try {
            const result = await apiFetch({
                url: 'api/football/payment/initiate/',
                method: 'POST',
                body: { course_id: test.id, enrollment_id: enrollment.id }
            }) as PaymentInitiateResponse

            if (result.success && result.data) {
                sessionStorage.setItem('football_payment_pending', 'true')
                sessionStorage.setItem('football_payment_test_id', String(test.id))
                window.location.href = result.data.gateway_url
            } else {
                setError(result.message || 'خطا در اتصال به درگاه پرداخت')
                setTimeout(() => setError(''), 4000)
                setPaymentProcessing(false)
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور')
            setTimeout(() => setError(''), 4000)
            setPaymentProcessing(false)
        }
    }

    const handleCancelEnrollment = async () => {
        if (!enrollment) return
        setShowModal(null)
        setCancelProcessing(true)

        try {
            const result = await apiFetch({
                url: `api/football/enrollment/${enrollment.id}/`,
                method: 'DELETE'
            })

            if (result.success) {
                setEnrollment(null)
                setSuccess('ثبت‌ نام با موفقیت لغو شد')
                await refreshEnrollments()
                setTimeout(() => setSuccess(''), 3000)
            } else {
                setError(result.message || 'خطا در لغو ثبت‌نام')
                setTimeout(() => setError(''), 4000)
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور')
            setTimeout(() => setError(''), 4000)
        } finally {
            setCancelProcessing(false)
        }
    }

    // Handle payment callback
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const paymentStatus = urlParams.get('status')
        const paymentPending = sessionStorage.getItem('football_payment_pending')

        if (paymentStatus === 'success' && paymentPending === 'true') {
            setSuccess('پرداخت با موفقیت انجام شد. ثبت‌نام شما تکمیل گردید.')
            sessionStorage.removeItem('football_payment_pending')
            refreshEnrollments()
            window.history.replaceState({}, '', window.location.pathname)
            setTimeout(() => setSuccess(''), 5000)
        } else if (paymentStatus === 'failed' && paymentPending === 'true') {
            setError('پرداخت ناموفق بود. لطفاً مجدداً تلاش کنید.')
            sessionStorage.removeItem('football_payment_pending')
            sessionStorage.removeItem('football_payment_test_id')
            setTimeout(() => setError(''), 5000)
        }
    }, [])

    if (!isValidId || isLoadingActiveUser || loading) {
        return <LoadingSpinner />
    }

    if ((error && !test) || !test) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorIcon}><Icon icon={Icons.timesCircle} /></div>
                <div><h3>خطا</h3><p>{error || 'تست مورد نظر یافت نشد'}</p></div>
                <button onClick={() => router.back()} className={styles.backButton}>بازگشت</button>
            </div>
        )
    }

    const disableReason = getDisableReason()

    let statusBadge = null
    if (isEnrolled) {
        statusBadge = { text: 'ثبت‌ نام قطعی', class: styles.confirmedBadge, icon: Icons.check }
    } else if (isPreRegistered) {
        statusBadge = { text: 'در انتظار پرداخت', class: styles.pendingBadge, icon: Icons.clock }
    } else {
        statusBadge = { text: 'ثبت‌ نام نشده', class: styles.notRegisteredBadge, icon: Icons.infoCircle }
    }

    const getGenderDisplay = (gender: string) => {
        switch (gender) {
            case 'MALE': return 'آقایان'
            case 'FEMALE': return 'بانوان'
            default: return 'نامشخص'
        }
    }

    const getAgeCategoryLabel = (ageCategory: string) => {
        const ageMap: Record<string, string> = {
            'U12': 'زیر ۱۲ سال',
            'U13': 'زیر ۱۳ سال',
            'U14': 'زیر ۱۴ سال',
            'U15': 'زیر ۱۵ سال',
            'U17': 'زیر ۱۷ سال',
            'U18': 'زیر ۱۸ سال',
            'YOUTH': 'جوانان',
            'U21': 'زیر ۲۱ سال',
        }
        return ageMap[ageCategory] || ageCategory
    }

    const formatPersianDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        }).format(date)
    }

    const formatTime = (timeString: string) => {
        return timeString.slice(0, 5)
    }

    const formatPrice = (price: string | number) => {
        return (Number(price) / 10).toLocaleString()
    }

    return (
        <div className={styles.container}>
            {success && (
                <div className={styles.successMessage}>
                    <Icon icon={Icons.check} />
                    <span>{success}</span>
                </div>
            )}
            {error && (
                <div className={styles.errorMessage}>
                    <Icon icon={Icons.timesCircle} />
                    <span>{error}</span>
                </div>
            )}

            <div className={styles.testHeaderCard}>
                <div className={styles.headerIcon}>
                    <Icon icon={Icons.football} />
                </div>
                <div className={styles.headerInfo}>
                    <h3 className={styles.testName}>{'پست '} {test.position_display} ({test.position})</h3>
                    {test.academy && (
                        <>
                            <p className={styles.academyName}>ورزشگاه {test.academy.name}</p>
                            {test.academy.address_text && (
                                <div className={styles.addressRow}>
                                    <Icon icon={Icons.location} className={styles.addressIcon} />
                                    <span>{test.academy.address_text}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
                {statusBadge && (
                    <div className={`${styles.statusBadge} ${statusBadge.class}`}>
                        <Icon icon={statusBadge.icon} /><span>{statusBadge.text}</span>
                    </div>
                )}
            </div>

            {/* Schedule Card */}
            <div className={styles.scheduleCard}>
                <h3 className={styles.cardTitle}>زمان برگزاری</h3>
                <div className={styles.scheduleContainer}>
                    <div className={styles.scheduleRow}>
                        <div className={styles.scheduleDay}>
                            <Icon icon={Icons.calendar} className={styles.scheduleIcon} />
                            <span>تاریخ</span>
                        </div>
                        <div className={styles.scheduleTime}>
                            <span>{formatPersianDate(test.test_date)}</span>
                        </div>
                    </div>
                    <div className={styles.scheduleRow}>
                        <div className={styles.scheduleDay}>
                            <Icon icon={Icons.clock} className={styles.scheduleIcon} />
                            <span>ساعت</span>
                        </div>
                        <div className={styles.scheduleTime}>
                            <span>{formatTime(test.start_time)} تا {formatTime(test.end_time)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                    <Icon icon={Icons.users} />
                    <div>
                        <label>ظرفیت</label>
                        <span>{test.max_participants} نفر</span>
                    </div>
                </div>
                <div className={styles.infoCard}>
                    <Icon icon={Icons.user} />
                    <div>
                        <label>جنسیت</label>
                        <span>{getGenderDisplay(test.gender_requirement)}</span>
                    </div>
                </div>
                <div className={styles.infoCard}>
                    <Icon icon={Icons.user} />
                    <div>
                        <label>رده سنی</label>
                        <span>{getAgeCategoryLabel(test.age_category)}</span>
                    </div>
                </div>
                <div className={styles.infoCard}>
                    <Icon icon={Icons.user} />
                    <div>
                        <label>پست تخصصی</label>
                        <span>{test.position_display}</span>
                    </div>
                </div>
            </div>

            {/* Price Card */}
            <div className={styles.priceCard}>
                <div className={styles.priceRow}>
                    <span>هزینه تست</span>
                    <span>{formatPrice(test.price)} تومان</span>
                </div>
                <div className={styles.priceDivider}></div>
                <div className={styles.totalRow}>
                    <span>مبلغ قابل پرداخت</span>
                    <span>{formatPrice(test.price)} تومان</span>
                </div>
            </div>

            {/* Actions Section */}
            <div className={styles.actionsSection}>
                {isEnrolled ? (
                    <button onClick={() => setShowModal('cancel')} className={styles.cancelButton}>
                        <Icon icon={Icons.timesCircle} /><span>لغو ثبت‌نام</span>
                    </button>
                ) : isPreRegistered ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <button onClick={() => setShowModal('pay')} disabled={paymentProcessing} className={styles.payButton}>
                            {paymentProcessing ? (
                                <><span>پرداخت و تکمیل ثبت‌نام</span> <div className={styles.smallSpinner}></div></>
                            ) : (
                                <><Icon icon={Icons.creditCard} /><span>پرداخت و تکمیل ثبت‌نام</span></>
                            )}
                        </button>
                        <button onClick={() => setShowModal('cancel')} disabled={cancelProcessing} className={styles.cancelButton}>
                            {cancelProcessing ? (
                                <><span>لغو ثبت‌نام</span> <div className={styles.smallSpinner}></div></>
                            ) : (
                                <><Icon icon={Icons.timesCircle} /><span>لغو ثبت‌نام</span></>
                            )}
                        </button>
                    </div>
                ) : canPreRegister() ? (
                    <button onClick={() => setShowModal('preRegister')} disabled={processing} className={styles.preRegisterButton}>
                        {processing ? (
                            <><span>پیش‌ ثبت‌نام</span> <div className={styles.smallSpinner}></div></>
                        ) : (
                            <><Icon icon={Icons.edit} /><span>پیش‌ ثبت‌نام</span></>
                        )}
                    </button>
                ) : (
                    activeUser ? (
                        disableReason && (
                            <div className={styles.unavailableBox}>
                                <Icon icon={Icons.infoCircle} /><p>{disableReason}</p>
                            </div>
                        )
                    ) : (
                        <button
                            className={styles.preRegisterButton}
                            onClick={() => {
                                sessionStorage.setItem('pendingRegistration', JSON.stringify({ courseId: test.id, parent: "football" }))
                                router.push('/login')
                            }}
                        >
                            <Icon icon={Icons.edit} /><span>پیش‌ ثبت‌ نام</span>
                        </button>
                    )
                )}
            </div>

            {/* Modals */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => !processing && !cancelProcessing && !paymentProcessing && setShowModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        {showModal === 'preRegister' && (
                            <>
                                <div className={styles.modalIcon}><Icon icon={Icons.edit} /></div>
                                <h3 className={styles.modalTitle}>تأیید پیش‌ثبت‌نام</h3>
                                <p className={styles.modalText}>آیا مایل به پیش‌ثبت‌نام در تست "{test.position_display}" هستید؟</p>
                                <div className={styles.modalWarning}>
                                    <Icon icon={Icons.infoCircle} /><span>پس از پیش‌ثبت‌نام، برای تکمیل باید پرداخت را انجام دهید</span>
                                </div>
                                <div className={styles.modalActions}>
                                    <button onClick={() => setShowModal(null)} disabled={processing} className={styles.modalCancelBtn}>انصراف</button>
                                    <button onClick={handlePreRegister} disabled={processing} className={styles.modalConfirmBtn}>
                                        {processing ? <div className={styles.smallSpinner}></div> : 'تأیید'}
                                    </button>
                                </div>
                            </>
                        )}
                        {showModal === 'pay' && (
                            <>
                                <div className={styles.modalIcon}><Icon icon={Icons.creditCard} /></div>
                                <h3 className={styles.modalTitle}>تأیید پرداخت</h3>
                                <p className={styles.modalText}>برای تکمیل ثبت‌نام در تست "{test.position_display}" مبلغ <strong>{formatPrice(test.price)} تومان</strong> پرداخت می‌شود</p>
                                <div className={styles.modalWarning}><Icon icon={Icons.infoCircle} /><span>این عملیات غیرقابل بازگشت است</span></div>
                                <div className={styles.modalActions}>
                                    <button onClick={() => setShowModal(null)} disabled={paymentProcessing} className={styles.modalCancelBtn}>انصراف</button>
                                    <button onClick={handlePayment} disabled={paymentProcessing} className={styles.modalConfirmBtn}>
                                        {paymentProcessing ? <div className={styles.smallSpinner}></div> : 'پرداخت'}
                                    </button>
                                </div>
                            </>
                        )}
                        {showModal === 'cancel' && (
                            <>
                                <div className={styles.modalIcon}><Icon icon={Icons.timesCircle} /></div>
                                <h3 className={styles.modalTitle}>لغو ثبت‌نام</h3>
                                <p className={styles.modalText}>آیا از لغو ثبت‌نام در تست اطمینان دارید؟</p>
                                <div className={styles.modalWarning}><Icon icon={Icons.infoCircle} /><span>این عملیات غیرقابل بازگشت است</span></div>
                                <div className={styles.modalActions}>
                                    <button onClick={() => setShowModal(null)} disabled={cancelProcessing} className={styles.modalCancelBtn}>انصراف</button>
                                    <button onClick={handleCancelEnrollment} disabled={cancelProcessing} className={styles.modalDangerBtn}>
                                        {cancelProcessing ? <div className={styles.smallSpinner}></div> : 'لغو ثبت‌نام'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}