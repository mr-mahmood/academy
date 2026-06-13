'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useActiveUser } from '@/contexts/active_user_context'
import { useApi } from '@/hooks/useApi'
import { usePopup } from '@/hooks/Popup'
import type { FootballTest } from '@/types/FootballTest'
import type { FootballEnrollment } from '@/types/FootballEnrollment'
import styles from './footballTestDetail.module.css'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import AgeCategoryBadge from '@/components/AgeCategoryBadge/AgeCategoryBadge'
import { PaymentInitiateResponse } from '@/types/PaymentInitiateResponse'

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
    const [showModal, setShowModal] = useState<'register' | 'cancel' | null>(null)

    const testId = params.id as string
    const isValidId = testId && testId !== 'undefined'

    useEffect(() => {
        if (!isValidId) {
            router.replace('/football-test/courses')
        }
    }, [isValidId, router])

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

    useEffect(() => {
        if (!isValidId) return

        const fetchTest = async () => {
            setLoading(true)
            try {
                const result = await apiFetch({ url: `api/football/courses/${testId}/`, method: 'GET' })
                if (result.success) {
                    setTest(result.data?.course || result.data)
                } else {
                    showPopUp({
                        title: 'خطا',
                        message: 'تست مورد نظر یافت نشد',
                        type: 'error',
                        duration: 4000
                    })
                }
            } catch (err) {
                showPopUp({
                    title: 'خطا',
                    message: 'خطا در بارگذاری اطلاعات تست',
                    type: 'error',
                    duration: 4000
                })
            } finally {
                setLoading(false)
            }
        }
        fetchTest()
    }, [testId, isValidId])

    useEffect(() => {
        if (!test) return

        const found = userEnrollments.find(e => e.course?.id === test.id) || null
        setEnrollment(found)
    }, [userEnrollments, test])

    const isEnrolled = enrollment?.enrollment_status === 'CONFIRMED'
    const isRegistered = enrollment !== null

    const canRegister = useCallback((): boolean => {
        if (!test || !activeUser) return false
        if (test.status !== 'ACTIVE') return false
        if (isEnrolled) return false
        if (test.gender_requirement && test.gender_requirement !== activeUser.gender) return false
        if (activeUser.age_category === 'OOR') return false
        return true
    }, [test, activeUser, isEnrolled])

    const getDisableReason = useCallback((): string | null => {
        if (!test || !activeUser) return null
        if (isEnrolled) return 'شما قبلاً در این تست ثبت‌نام کرده‌اید'
        if (test.status !== 'ACTIVE') return 'این تست در حال حاضر فعال نیست'
        if (test.gender_requirement && test.gender_requirement !== activeUser.gender) return 'این تست برای جنسیت شما مناسب نیست'
        if (activeUser.age_category === 'OOR') return 'رده سنی شما برای ثبت‌نام معتبر نیست'
        return null
    }, [test, activeUser, isEnrolled])

    const refreshEnrollments = useCallback(async () => {
        const result = await apiFetch({ url: 'api/football/enrollment/', method: 'GET' })
        if (result.success) {
            const data = result.data?.enrollments || result.data || []
            setUserEnrollments(Array.isArray(data) ? data : [])
        }
    }, [])

    const handleRegisterAndPay = async () => {
        if (!activeUser || !test) return
        setShowModal(null)
        setRegistering(true)

        try {
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
                let errorMessage = 'خطا در ثبت‌ نام'
                switch (enrollmentResult.code) {
                    case 555:
                        errorMessage = 'ظرفیت تست تکمیل شده است'
                        break
                    case 556:
                        errorMessage = 'این تست در حال حاضر فعال نیست'
                        break
                    case 557:
                        errorMessage = 'شما قبلاً در این تست ثبت‌ نام کرده‌اید'
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
                showPopUp({
                    title: 'خطا',
                    message: paymentResult.message || 'خطا در اتصال به درگاه پرداخت',
                    type: 'error',
                    duration: 4000
                })
                setRegistering(false)
            }
        } catch (err) {
            console.error('Registration error:', err)
            showPopUp({
                title: 'خطا',
                message: 'خطا در ارتباط با سرور',
                type: 'error',
                duration: 4000
            })
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
                showPopUp({
                    title: 'موفق',
                    message: 'ثبت‌ نام با موفقیت لغو شد',
                    type: 'success',
                    duration: 3000
                })
                await refreshEnrollments()
            } else {
                showPopUp({
                    title: 'خطا',
                    message: result.message || 'خطا در لغو ثبت‌نام',
                    type: 'error',
                    duration: 4000
                })
            }
        } catch (err) {
            showPopUp({
                title: 'خطا',
                message: 'خطا در ارتباط با سرور',
                type: 'error',
                duration: 4000
            })
        } finally {
            setCancelProcessing(false)
        }
    }

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const paymentStatus = urlParams.get('status')
        const paymentPending = sessionStorage.getItem('football_payment_pending')

        if (paymentStatus === 'success' && paymentPending === 'true') {
            showPopUp({
                title: 'موفق',
                message: 'پرداخت با موفقیت انجام شد. ثبت‌نام شما تکمیل گردید.',
                type: 'success',
                duration: 5000
            })
            sessionStorage.removeItem('football_payment_pending')
            sessionStorage.removeItem('football_payment_test_id')
            refreshEnrollments()
            window.history.replaceState({}, '', window.location.pathname)
        } else if (paymentStatus === 'failed' && paymentPending === 'true') {
            showPopUp({
                title: 'خطا',
                message: 'پرداخت ناموفق بود. لطفاً مجدداً تلاش کنید.',
                type: 'error',
                duration: 5000
            })
            sessionStorage.removeItem('football_payment_pending')
            sessionStorage.removeItem('football_payment_test_id')
        }
    }, [])

    if (!isValidId || isLoadingActiveUser || loading) {
        return <LoadingSpinner />
    }

    if (!test) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorIcon}><Icon icon={Icons.timesCircle} /></div>
                <div><h3>خطا</h3><p>تست مورد نظر یافت نشد</p></div>
                <button onClick={() => router.back()} className={styles.backButton}>بازگشت</button>
            </div>
        )
    }

    const disableReason = getDisableReason()

    const getGenderDisplay = (gender: string) => {
        switch (gender) {
            case 'MALE': return 'آقایان'
            case 'FEMALE': return 'بانوان'
            default: return 'نامشخص'
        }
    }

    const formatPrice = (price: string | number) => {
        return (Number(price) / 10).toLocaleString()
    }

    return (
        <div className={styles.container}>
            <AgeCategoryBadge ageCategory={activeUser?.age_category} />

            {/* Single Compact Card - Same styling as course detail */}
            <div className={styles.detailCard}>
                {/* Main Section - Test Name & Position */}
                <div className={styles.mainSection}>
                    <div className={styles.iconContainer}>
                        <Icon icon={Icons.football} />
                    </div>
                    <div className={styles.mainInfo}>
                        <h3 className={styles.title}>
                            تست فوتبال
                        </h3>
                        <span className={styles.positionText}>
                            پست {test.position_display} ({test.position})
                        </span>
                    </div>
                    <div className={`${styles.statusBadge} ${isEnrolled ? styles.statusSuccess : isRegistered ? styles.statusWarning : styles.statusDefault}`}>
                        <Icon icon={isEnrolled ? Icons.check : isRegistered ? Icons.clock : Icons.infoCircle} />
                        <span>{isEnrolled ? 'ثبت‌ نام قطعی' : isRegistered ? 'در انتظار پرداخت' : 'ثبت‌ نام نشده'}</span>
                    </div>
                </div>

                {/* Academy Info Section */}
                {test.academy && (
                    <div className={styles.academySection}>
                        <div className={styles.academyRow}>
                            <Icon icon={Icons.building} className={styles.academyIcon} />
                            <span className={styles.academyName}>ورزشگاه {test.academy.name}</span>
                        </div>
                        {test.academy.address_text && (
                            <div className={styles.addressRowCompact}>
                                <Icon icon={Icons.location} className={styles.addressIconCompact} />
                                <span>{test.academy.address_text}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Info Grid - Gender & Position (2 columns) */}
                <div className={styles.infoGridCompact}>
                    <div className={styles.infoItem}>
                        <Icon icon={Icons.user} className={styles.infoIcon} />
                        <div>
                            <span className={styles.infoLabel}>جنسیت</span>
                            <span className={styles.infoValue}>{getGenderDisplay(test.gender_requirement)}</span>
                        </div>
                    </div>
                    <div className={styles.infoItem}>
                        <Icon icon={Icons.user} className={styles.infoIcon} />
                        <div>
                            <span className={styles.infoLabel}>پست تخصصی</span>
                            <span className={styles.infoValue}>{test.position_display} ({test.position})</span>
                        </div>
                    </div>
                </div>

                {/* Price Section */}
                <div className={styles.priceSectionCompact}>
                    <div className={styles.priceRowCompact}>
                        <span className={styles.priceLabelCompact}>هزینه تست</span>
                        <span className={styles.priceValueCompact}>{formatPrice(test.price)} تومان</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.actionsSectionCompact}>
                    {isEnrolled ? (
                        <button onClick={() => setShowModal('cancel')} className={styles.dangerButtonCompact}>
                            <Icon icon={Icons.timesCircle} />
                            <span>لغو ثبت‌ نام</span>
                        </button>
                    ) : canRegister() ? (
                        <button onClick={() => setShowModal('register')} disabled={registering} className={styles.primaryButtonCompact}>
                            {registering ? (
                                <><span>در حال ثبت‌ نام و پرداخت</span> <div className={styles.smallSpinner}></div></>
                            ) : (
                                <><Icon icon={Icons.creditCard} /><span>ثبت‌نام و پرداخت</span></>
                            )}
                        </button>
                    ) : (
                        activeUser ? (
                            disableReason && (
                                <div className={styles.unavailableBoxCompact}>
                                    <Icon icon={Icons.infoCircle} />
                                    <p>{disableReason}</p>
                                </div>
                            )
                        ) : (
                            <button
                                className={styles.primaryButtonCompact}
                                onClick={() => {
                                    sessionStorage.setItem('pendingRegistration', JSON.stringify({ courseId: test.id, parent: "football" }))
                                    showPopUp({
                                        title: 'ادامه ثبت نام',
                                        message: 'برای ادامه ثبت نام لازم است وارد حساب کاربری خود شوید',
                                        type: 'warning',
                                        onClose() {
                                            router.push('/login');
                                        },
                                        onAutoClose() {
                                            router.push('/login');
                                        },
                                        duration: 5000
                                    })
                                }}
                            >
                                <Icon icon={Icons.edit} /><span>ورود و ثبت‌نام</span>
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Modals - Styled consistently */}
            {showModal === 'register' && (
                <div className={styles.modalOverlay} onClick={() => !registering && setShowModal(null)}>
                    <div className={styles.modalCompact} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalIconCompact}><Icon icon={Icons.creditCard} /></div>
                        <h3 className={styles.modalTitleCompact}>تأیید ثبت‌نام و پرداخت</h3>
                        <p className={styles.modalTextCompact}>
                            آیا مایل به ثبت‌ نام در تست و پرداخت مبلغ <strong>{formatPrice(test.price)} تومان</strong> هستید؟
                        </p>
                        <div className={styles.modalWarningCompact}>
                            <Icon icon={Icons.infoCircle} />
                            <span>پس از پرداخت، ثبت‌ نام شما نهایی خواهد شد</span>
                        </div>
                        <div className={styles.modalActionsCompact}>
                            <button onClick={() => setShowModal(null)} disabled={registering} className={styles.modalCancelBtnCompact}>
                                انصراف
                            </button>
                            <button onClick={handleRegisterAndPay} disabled={registering} className={styles.modalConfirmBtnCompact}>
                                {registering ? <div className={styles.smallSpinner}></div> : 'تأیید و پرداخت'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal === 'cancel' && (
                <div className={styles.modalOverlay} onClick={() => !cancelProcessing && setShowModal(null)}>
                    <div className={styles.modalCompact} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalIconCompact}><Icon icon={Icons.timesCircle} /></div>
                        <h3 className={styles.modalTitleCompact}>لغو ثبت‌نام</h3>
                        <p className={styles.modalTextCompact}>آیا از لغو ثبت‌نام در تست اطمینان دارید؟</p>
                        <div className={styles.modalWarningCompact}>
                            <Icon icon={Icons.infoCircle} />
                            <span>در صورت لغو ثبت نام وجه پرداختی شما غیر قابل بازگشت است</span>
                        </div>
                        <div className={styles.modalActionsCompact}>
                            <button onClick={() => setShowModal(null)} disabled={cancelProcessing} className={styles.modalCancelBtnCompact}>
                                انصراف
                            </button>
                            <button onClick={handleCancelEnrollment} disabled={cancelProcessing} className={styles.modalDangerBtnCompact}>
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