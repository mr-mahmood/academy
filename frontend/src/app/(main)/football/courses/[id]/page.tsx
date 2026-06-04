'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useActiveUser } from '@/contexts/active_user_context'
import { useApi } from '@/hooks/useApi'
import { usePopup } from '@/hooks/Popup'
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
    const { showPopUp, PopupComponent } = usePopup()
    const [test, setTest] = useState<FootballTest | null>(null)
    const [enrollment, setEnrollment] = useState<FootballEnrollment | null>(null)
    const [userEnrollments, setUserEnrollments] = useState<FootballEnrollment[]>([])
    const [loading, setLoading] = useState(true)
    const [registering, setRegistering] = useState(false)
    const [cancelProcessing, setCancelProcessing] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showModal, setShowModal] = useState<'register' | 'cancel' | null>(null)

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

    const isEnrolled = enrollment?.enrollment_status === 'CONFIRMED'
    const isRegistered = enrollment !== null

    const canRegister = (): boolean => {
        if (!test || !activeUser) return false
        if (test.status !== 'ACTIVE') return false
        if (isEnrolled) return false
        if (test.gender_requirement && test.gender_requirement !== activeUser.gender) return false
        if (activeUser.age_category === 'OOR') return false
        return true
    }

    const getDisableReason = (): string | null => {
        if (!test || !activeUser) return null
        if (isEnrolled) return 'شما قبلاً در این تست ثبت‌نام کرده‌اید'
        if (test.status !== 'ACTIVE') return 'این تست در حال حاضر فعال نیست'
        if (test.gender_requirement && test.gender_requirement !== activeUser.gender) return 'این تست برای جنسیت شما مناسب نیست'
        if (activeUser.age_category === 'OOR') return 'رده سنی شما برای ثبت‌نام معتبر نیست'
        return null
    }

    const refreshEnrollments = async () => {
        const result = await apiFetch({ url: 'api/football/enrollment/', method: 'GET' })
        if (result.success) {
            const data = result.data?.enrollments || result.data || []
            setUserEnrollments(Array.isArray(data) ? data : [])
        }
    }

    const handleRegisterAndPay = async () => {
        if (!activeUser || !test) return
        setShowModal(null)
        setRegistering(true)
        setError('')

        try {
            // First, create enrollment
            const enrollmentResult = await apiFetch({
                url: 'api/football/enrollment/',
                method: 'POST',
                body: {
                    position: test.position,
                    academy_id: test.academy.id,
                    gender_requirement: test.gender_requirement
                }
            })

            if (!enrollmentResult.success) {
                let errorMessage = 'خطا در ثبت‌نام'
                switch (enrollmentResult.code) {
                    case 555:
                        errorMessage = 'این تست تکمیل شده است'
                        break
                    case 556:
                        errorMessage = 'این تست در حال حاضر فعال نیست'
                        break
                    case 557:
                        errorMessage = 'شما قبلاً در این تست ثبت‌نام کرده‌اید'
                        break
                    case 558:
                        errorMessage = 'تداخل زمانی با تست‌های دیگر شما وجود دارد'
                        break
                    case 559:
                        errorMessage = 'این تست برای رده سنی شما مناسب نیست'
                        break
                    case 561:
                        errorMessage = 'این تست برای جنسیت شما مناسب نیست'
                        break
                    default:
                        errorMessage = enrollmentResult.message || 'خطا در ثبت‌نام'
                }
                showPopUp({
                    title: 'خطا',
                    message: errorMessage,
                    type: 'error',
                    duration: 4000
                })
                setRegistering(false)
                return
            }

            const newEnrollment = enrollmentResult.data.enrollment

            // Then, initiate payment
            const paymentResult = await apiFetch({
                url: 'api/football/payment/initiate/',
                method: 'POST',
                body: {
                    course_id: test.id,
                    enrollment_id: newEnrollment.id
                }
            }) as PaymentInitiateResponse

            if (paymentResult.success && paymentResult.data) {
                sessionStorage.setItem('football_payment_pending', 'true')
                sessionStorage.setItem('football_payment_test_id', String(test.id))
                window.location.href = paymentResult.data.gateway_url
            } else {
                setError(paymentResult.message || 'خطا در اتصال به درگاه پرداخت')
                setTimeout(() => setError(''), 4000)
                setRegistering(false)
            }
        } catch (err) {
            console.error('Registration error:', err)
            setError('خطا در ارتباط با سرور')
            setTimeout(() => setError(''), 4000)
            setRegistering(false)
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
    } else if (isRegistered) {
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
            'U21': 'امید',
            'OOR': 'خارج از محدوده'
        }
        return ageMap[ageCategory] || ageCategory
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
                    <div className={styles.headerTopRow}>
                        <h3 className={styles.testName}>
                            {'پست '} {test.position_display} ({test.position})
                        </h3>
                        {statusBadge && (
                            <div className={`${styles.statusBadge} ${statusBadge.class}`}>
                                <Icon icon={statusBadge.icon} />
                                <span>{statusBadge.text}</span>
                            </div>
                        )}
                    </div>
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
            </div>

            {/* Info Grid */}
            <div className={styles.infoGrid}>
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
                ) : canRegister() ? (
                    <button onClick={() => setShowModal('register')} disabled={registering} className={styles.registerButton}>
                        {registering ? (
                            <><span>در حال ثبت‌نام و پرداخت</span> <div className={styles.smallSpinner}></div></>
                        ) : (
                            <><Icon icon={Icons.creditCard} /><span>ثبت‌نام و پرداخت</span></>
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
                            className={styles.registerButton}
                            onClick={() => {
                                sessionStorage.setItem('pendingRegistration', JSON.stringify({ courseId: test.id, parent: "football" }))
                                router.push('/login')
                            }}
                        >
                            <Icon icon={Icons.edit} /><span>ورود و ثبت‌نام</span>
                        </button>
                    )
                )}
            </div>

            {/* Modal */}
            {showModal === 'register' && (
                <div className={styles.modalOverlay} onClick={() => !registering && setShowModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalIcon}><Icon icon={Icons.creditCard} /></div>
                        <h3 className={styles.modalTitle}>تأیید ثبت‌نام و پرداخت</h3>
                        <p className={styles.modalText}>
                            آیا مایل به ثبت‌نام در تست "{test.position_display}" و پرداخت مبلغ <strong>{formatPrice(test.price)} تومان</strong> هستید؟
                        </p>
                        <div className={styles.modalWarning}>
                            <Icon icon={Icons.infoCircle} />
                            <span>پس از پرداخت، ثبت‌نام شما نهایی خواهد شد</span>
                        </div>
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowModal(null)} disabled={registering} className={styles.modalCancelBtn}>
                                انصراف
                            </button>
                            <button onClick={handleRegisterAndPay} disabled={registering} className={styles.modalConfirmBtn}>
                                {registering ? <div className={styles.smallSpinner}></div> : 'تأیید و پرداخت'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal === 'cancel' && (
                <div className={styles.modalOverlay} onClick={() => !cancelProcessing && setShowModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalIcon}><Icon icon={Icons.timesCircle} /></div>
                        <h3 className={styles.modalTitle}>لغو ثبت‌نام</h3>
                        <p className={styles.modalText}>آیا از لغو ثبت‌نام در تست اطمینان دارید؟</p>
                        <div className={styles.modalWarning}>
                            <Icon icon={Icons.infoCircle} />
                            <span>این عملیات غیرقابل بازگشت است</span>
                        </div>
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowModal(null)} disabled={cancelProcessing} className={styles.modalCancelBtn}>
                                انصراف
                            </button>
                            <button onClick={handleCancelEnrollment} disabled={cancelProcessing} className={styles.modalDangerBtn}>
                                {cancelProcessing ? <div className={styles.smallSpinner}></div> : 'لغو ثبت‌نام'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {PopupComponent}
        </div>
    )
}