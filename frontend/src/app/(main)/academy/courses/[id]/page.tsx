'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useActiveUser } from '@/contexts/active_user_context'
import { useApi } from '@/hooks/useApi'
import { usePopup } from '@/hooks/Popup'
import type { Course } from '@/types/Course'
import type { Enrollment } from '@/types/enrollment'
import type { Schedule } from '@/types/Schedule'
import styles from './courseDetail.module.css'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import { PaymentInitiateResponse } from '@/types/PaymentInitiateResponse'

interface SupportContact {
    name: string
    phone: string
    gender?: 'MALE' | 'FEMALE'
}

const getSupportContact = (sportName?: string, genderRequirement?: string): SupportContact | null => {
    const sport = sportName?.toLowerCase() || ''

    if (sport.includes('فوتبال') || sport.includes('فوتسال')) {
        return { name: 'سعید طاهری', phone: '09131860199', gender: 'MALE' }
    }

    if (sport.includes('والیبال') && genderRequirement === 'MALE') {
        return { name: 'آقای شفیعی', phone: '09133687181', gender: 'MALE' }
    }

    if (sport.includes('والیبال') && genderRequirement === 'FEMALE') {
        return { name: 'خانم عالم پیکر', phone: '09131292268', gender: 'FEMALE' }
    }

    return null
}

export default function ClassDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { activeUser, isLoadingActiveUser } = useActiveUser()
    const { apiFetch } = useApi()
    const { showPopUp, PopupComponent } = usePopup()
    const [course, setCourse] = useState<Course | null>(null)
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
    const [userEnrollments, setUserEnrollments] = useState<Enrollment[]>([])
    const [loading, setLoading] = useState(true)
    const [preRegistering, setPreRegistering] = useState(false)
    const [paymentProcessing, setPaymentProcessing] = useState(false)
    const [cancelProcessing, setCancelProcessing] = useState(false)
    const [showModal, setShowModal] = useState<'preRegister' | 'pay' | 'cancel' | null>(null)

    const classId = params.id as string
    const isValidId = classId && classId !== 'undefined'

    useEffect(() => {
        if (!isValidId) {
            router.replace('/dashboard')
        }
    }, [isValidId, router])

    useEffect(() => {
        if (!activeUser || !isValidId) return

        const fetchEnrollments = async () => {
            const result = await apiFetch({ url: 'api/academy/enrollment/', method: 'GET' })
            if (result.success) {
                const data = result.data?.enrollments || result.data || []
                setUserEnrollments(Array.isArray(data) ? data : [])
            }
        }
        fetchEnrollments()
    }, [activeUser, isValidId])

    useEffect(() => {
        if (!isValidId) return

        const fetchCourse = async () => {
            setLoading(true)
            try {
                const result = await apiFetch({ url: `api/academy/courses/${classId}/`, method: 'GET' })
                if (result.success) {
                    setCourse(result.data?.course || result.data as Course)
                }
            } catch (err) {
                // Handle error silently
            } finally {
                setLoading(false)
            }
        }
        fetchCourse()
    }, [classId, isValidId])

    useEffect(() => {
        if (!course) return

        const found = userEnrollments.find(e => e.course?.id === course.id) || null
        setEnrollment(found)
    }, [userEnrollments, course])

    const hasTimeConflict = useCallback((): boolean => {
        if (!course?.schedule?.length) return false
        return userEnrollments.some(e => {
            const ec = e.course
            if (!ec || ec.id === course.id || !ec.schedule?.length) return false
            return ec.schedule.some(es => course.schedule!.some(ns =>
                es.weekday === ns.weekday && es.start_time < ns.end_time && es.end_time > ns.start_time
            ))
        })
    }, [course, userEnrollments])

    const isEnrolled = enrollment?.enrollment_status === 'CONFIRMED'
    const isPreRegistered = enrollment?.enrollment_status === 'WAITING_FOR_PAYMENT'

    const canPreRegister = useCallback((): boolean => {
        if (!course || !activeUser) return false
        if (course.status !== 'ACTIVE') return false
        if (isEnrolled) return false
        if (isPreRegistered) return false
        if (course.gender_requirement && course.gender_requirement !== activeUser?.gender) return false
        if (hasTimeConflict()) return false
        return true
    }, [course, activeUser, isEnrolled, isPreRegistered, hasTimeConflict])

    const getDisableReason = useCallback((): string | null => {
        if (!course || !activeUser) return null
        if (isEnrolled) return 'شما قبلاً در این دوره ثبت‌نام کرده‌اید'
        if (isPreRegistered) return 'پیش‌ ثبت‌ نام انجام شده است. برای تکمیل، پرداخت را انجام دهید'
        if (course.status !== 'ACTIVE') return 'این دوره در حال حاضر فعال نیست'
        if (course.gender_requirement && course.gender_requirement !== activeUser.gender) return 'این دوره برای جنسیت شما مناسب نیست'
        if (hasTimeConflict()) return 'تداخل زمانی با دوره‌های دیگر شما وجود دارد'
        return null
    }, [course, activeUser, isEnrolled, isPreRegistered, hasTimeConflict])

    const refreshEnrollments = useCallback(async () => {
        const result = await apiFetch({ url: 'api/academy/enrollment/', method: 'GET' })
        if (result.success) {
            const data = result.data?.enrollments || result.data || []
            setUserEnrollments(Array.isArray(data) ? data : [])
        }
    }, [])

    const handlePreRegister = async () => {
        if (!activeUser || !course) return
        setShowModal(null)
        setPreRegistering(true)

        try {
            const result = await apiFetch({
                url: 'api/academy/enrollment/',
                method: 'POST',
                body: { course_id: course.id }
            })

            if (!result.success) {
                let errorMessage = 'خطا در پیش‌ ثبت‌ نام'
                switch (result.code) {
                    case 506:
                        errorMessage = 'ظرفیت دوره تکمیل شده است'
                        break
                    case 507:
                        errorMessage = 'این دوره در حال حاضر فعال نیست'
                        break
                    case 509:
                        errorMessage = 'شما قبلاً در این دوره ثبت‌ نام کرده‌اید'
                        break
                    case 510:
                        errorMessage = 'تداخل زمانی با دوره‌های دیگر شما وجود دارد'
                        break
                    case 508:
                        errorMessage = 'این دوره برای جنسیت شما مناسب نیست'
                        break
                    default:
                        errorMessage = result.message || 'خطا در پیش‌ ثبت‌نام'
                }
                showPopUp({
                    title: 'خطا',
                    message: errorMessage,
                    type: 'error',
                    duration: 4000
                })
                setPreRegistering(false)
                return
            }

            showPopUp({
                title: 'موفق',
                message: 'پیش‌ ثبت‌ نام با موفقیت انجام شد. لطفاً پرداخت را تکمیل کنید.',
                type: 'success',
                duration: 3000
            })
            await refreshEnrollments()
        } catch (err) {
            console.error('Pre-registration error:', err)
            showPopUp({
                title: 'خطا',
                message: 'خطا در ارتباط با سرور',
                type: 'error',
                duration: 4000
            })
        } finally {
            setPreRegistering(false)
        }
    }

    const handlePayment = async () => {
        if (!activeUser || !course || !enrollment) return
        setShowModal(null)
        setPaymentProcessing(true)

        try {
            const result = await apiFetch({
                url: 'api/academy/payment/initiate/',
                method: 'POST',
                body: {
                    course_id: course.id,
                    enrollment_id: enrollment.id
                }
            }) as PaymentInitiateResponse

            if (result.success && result.data) {
                sessionStorage.setItem('academy_payment_pending', 'true')
                sessionStorage.setItem('academy_payment_course_id', String(course.id))
                window.location.href = result.data.gateway_url
            } else {
                showPopUp({
                    title: 'خطا',
                    message: result.message || 'خطا در اتصال به درگاه پرداخت',
                    type: 'error',
                    duration: 4000
                })
                setPaymentProcessing(false)
            }
        } catch (err) {
            console.error('Payment error:', err)
            showPopUp({
                title: 'خطا',
                message: 'خطا در ارتباط با سرور',
                type: 'error',
                duration: 4000
            })
            setPaymentProcessing(false)
        }
    }

    const handleCancelEnrollment = async () => {
        if (!enrollment) return
        setShowModal(null)
        setCancelProcessing(true)

        try {
            const result = await apiFetch({
                url: `api/academy/enrollment/${enrollment.id}/`,
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
                    message: result.message || 'خطا در لغو ثبت‌ نام',
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
        const paymentPending = sessionStorage.getItem('academy_payment_pending')

        if (paymentStatus === 'success' && paymentPending === 'true') {
            showPopUp({
                title: 'موفق',
                message: 'پرداخت با موفقیت انجام شد. ثبت‌ نام شما تکمیل گردید.',
                type: 'success',
                duration: 5000
            })
            sessionStorage.removeItem('academy_payment_pending')
            refreshEnrollments()
            window.history.replaceState({}, '', window.location.pathname)
        } else if (paymentStatus === 'failed' && paymentPending === 'true') {
            showPopUp({
                title: 'خطا',
                message: 'پرداخت ناموفق بود. لطفاً مجدداً تلاش کنید.',
                type: 'error',
                duration: 5000
            })
            sessionStorage.removeItem('academy_payment_pending')
            sessionStorage.removeItem('academy_payment_course_id')
        }
    }, [])

    if (!isValidId || isLoadingActiveUser || loading) {
        return <LoadingSpinner />
    }

    if (!course) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorIcon}><Icon icon={Icons.timesCircle} /></div>
                <div><h3>خطا</h3><p>دوره مورد نظر یافت نشد</p></div>
                <button onClick={() => router.back()} className={styles.backButton}>بازگشت</button>
            </div>
        )
    }

    const disableReason = getDisableReason()
    const supportContact = getSupportContact(course.sport?.name, course.gender_requirement)

    function getDayName(weekday: number): string {
        const days: Record<number, string> = { 0: 'شنبه', 1: 'یکشنبه', 2: 'دوشنبه', 3: 'سه‌شنبه', 4: 'چهارشنبه', 5: 'پنجشنبه', 6: 'جمعه' }
        return days[weekday] || String(weekday)
    }

    function formatPrice(price: string | number): string {
        return (Number(price) / 10).toLocaleString()
    }

    return (
        <div className={styles.container}>
            {/* Single Compact Card - Like CourseCard */}
            <div className={styles.detailCard}>
                {/* Main Section - Sport Name & Sessions (Like CourseCard) */}
                <div className={styles.mainSection}>
                    <div className={styles.iconContainer}>
                        <Icon icon={Icons.football} />
                    </div>
                    <div className={styles.mainInfo}>
                        <h3 className={styles.title}>
                            {course.sport?.name || 'دوره ورزشی'}
                        </h3>
                        <span className={styles.sessionsText}>
                            {course.total_sessions || 0} جلسه
                        </span>
                    </div>
                    <div className={`${styles.statusBadge} ${isEnrolled ? styles.statusSuccess : isPreRegistered ? styles.statusWarning : styles.statusDefault}`}>
                        <Icon icon={isEnrolled ? Icons.check : isPreRegistered ? Icons.clock : Icons.infoCircle} />
                        <span>{isEnrolled ? 'ثبت‌نام قطعی' : isPreRegistered ? 'در انتظار پرداخت' : 'ثبت‌نام نشده'}</span>
                    </div>
                </div>

                {/* Gender Section (Like CourseCard) */}
                <div className={styles.genderSection}>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        <Icon icon={Icons.user} className={styles.genderIcon} />
                        <span className={styles.genderLabel}>مناسب (ظرفیت)</span>
                    </div>
                    <span className={styles.genderValue}>
                        {course.gender_requirement === 'MALE' ? 'آقایان' : course.gender_requirement === 'FEMALE' ? 'بانوان' : 'نامشخص'}{` (${course.max_students} نفر)`}
                    </span>
                </div>

                {/* Schedule Section (Like CourseCard) */}
                {course.schedule && course.schedule.length > 0 && (
                    <div className={styles.scheduleContainer}>
                        {course.schedule.map((sched, index) => (
                            <div key={sched.id || index} className={styles.scheduleRow}>
                                <div className={styles.scheduleDay}>
                                    <Icon icon={Icons.calendar} className={styles.scheduleIcon} />
                                    <span>{getDayName(sched.weekday)}</span>
                                </div>
                                <div className={styles.scheduleTime}>
                                    <span>
                                        {sched.end_time?.slice(0, 5)} - {sched.start_time?.slice(0, 5)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Address Row (Like CourseCard) */}
                <div className={styles.addressRow}>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        <Icon icon={Icons.building} className={styles.addressIcon} />
                        <span className={styles.addressValue}>ورزشگاه {course.academy.name}</span>
                        <span className={styles.addressSeparator} />
                    </div>
                    {course.academy.address_text && (
                        <span className={styles.addressDetail}>{course.academy.address_text}</span>
                    )}
                </div>

                {/* Support Section - Optional */}
                {supportContact && (
                    <div className={styles.supportSection}>
                        <div className={styles.supportRow}>
                            <div className={styles.supportInfoCompact}>
                                <Icon icon={Icons.phone} className={styles.supportIconCompact} />
                                <span className={styles.supportLabel}>پشتیبانی:</span>
                            </div>
                            <a href={`tel:${supportContact.phone}`} className={styles.supportPhoneCompact}>
                                {supportContact.name} {supportContact.phone}
                            </a>
                        </div>
                    </div>
                )}

                {/* Price Section - Bottom */}
                <div className={styles.priceSectionCompact}>
                    <div className={styles.priceRowCompact}>
                        <span className={styles.priceLabelCompact}>هزینه دوره</span>
                        <span className={styles.priceValueCompact}>{formatPrice(course.price)} تومان</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.actionsSectionCompact}>
                    {isEnrolled ? (
                        <button onClick={() => setShowModal('cancel')} className={styles.dangerButtonCompact}>
                            <Icon icon={Icons.timesCircle} />
                            <span>لغو ثبت‌ نام</span>
                        </button>
                    ) : isPreRegistered ? (
                        <>
                            <button onClick={() => setShowModal('pay')} disabled={paymentProcessing} className={styles.primaryButtonCompact}>
                                {paymentProcessing ? (
                                    <><span>پرداخت و تکمیل ثبت‌ نام</span> <div className={styles.smallSpinner}></div></>
                                ) : (
                                    <><Icon icon={Icons.creditCard} /><span>پرداخت و تکمیل ثبت‌ نام</span></>
                                )}
                            </button>
                            <button onClick={() => setShowModal('cancel')} disabled={cancelProcessing} className={styles.dangerButtonCompact}>
                                {cancelProcessing ? (
                                    <><span>لغو ثبت‌ نام</span> <div className={styles.smallSpinner}></div></>
                                ) : (
                                    <><Icon icon={Icons.timesCircle} /><span>لغو ثبت‌ نام</span></>
                                )}
                            </button>
                        </>
                    ) : canPreRegister() ? (
                        <button onClick={() => setShowModal('preRegister')} disabled={preRegistering} className={styles.primaryButtonCompact}>
                            {preRegistering ? (
                                <><span>پیش‌ ثبت‌ نام</span> <div className={styles.smallSpinner}></div></>
                            ) : (
                                <><Icon icon={Icons.edit} /><span>پیش‌ ثبت‌ نام</span></>
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
                                    sessionStorage.setItem('pendingRegistration', JSON.stringify({ courseId: course.id, parent: "academy" }))
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
                                <Icon icon={Icons.edit} /><span>ورود و پیش‌ ثبت‌ نام</span>
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Modals - Styled consistently */}
            {
                showModal === 'preRegister' && (
                    <div className={styles.modalOverlay} onClick={() => !preRegistering && setShowModal(null)}>
                        <div className={styles.modalCompact} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalIconCompact}><Icon icon={Icons.edit} /></div>
                            <h3 className={styles.modalTitleCompact}>تأیید پیش‌ ثبت‌ نام</h3>
                            <p className={styles.modalTextCompact}>آیا مایل به پیش‌ ثبت‌ نام در دوره هستید؟</p>
                            <div className={styles.modalWarningCompact}>
                                <Icon icon={Icons.infoCircle} />
                                <span>پس از پیش‌ ثبت‌ نام، برای تکمیل باید پرداخت را انجام دهید</span>
                            </div>
                            <div className={styles.modalActionsCompact}>
                                <button onClick={() => setShowModal(null)} disabled={preRegistering} className={styles.modalCancelBtnCompact}>
                                    انصراف
                                </button>
                                <button onClick={handlePreRegister} disabled={preRegistering} className={styles.modalConfirmBtnCompact}>
                                    {preRegistering ? <div className={styles.smallSpinner}></div> : 'تأیید'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showModal === 'pay' && (
                    <div className={styles.modalOverlay} onClick={() => !paymentProcessing && setShowModal(null)}>
                        <div className={styles.modalCompact} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalIconCompact}><Icon icon={Icons.creditCard} /></div>
                            <h3 className={styles.modalTitleCompact}>تأیید پرداخت</h3>
                            <p className={styles.modalTextCompact}>
                                برای تکمیل ثبت‌ نام در دوره مبلغ <strong>{formatPrice(course.price)} تومان</strong> پرداخت می‌شود
                            </p>
                            <div className={styles.modalWarningCompact}>
                                <Icon icon={Icons.infoCircle} />
                                <span>این عملیات غیرقابل بازگشت است</span>
                            </div>
                            <div className={styles.modalActionsCompact}>
                                <button onClick={() => setShowModal(null)} disabled={paymentProcessing} className={styles.modalCancelBtnCompact}>
                                    انصراف
                                </button>
                                <button onClick={handlePayment} disabled={paymentProcessing} className={styles.modalConfirmBtnCompact}>
                                    {paymentProcessing ? <div className={styles.smallSpinner}></div> : 'پرداخت'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showModal === 'cancel' && (
                    <div className={styles.modalOverlay} onClick={() => !cancelProcessing && setShowModal(null)}>
                        <div className={styles.modalCompact} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalIconCompact}><Icon icon={Icons.timesCircle} /></div>
                            <h3 className={styles.modalTitleCompact}>لغو ثبت‌ نام</h3>
                            <p className={styles.modalTextCompact}>آیا از لغو ثبت‌ نام در دوره اطمینان دارید؟</p>
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
                )
            }
            {PopupComponent}
        </div >
    )
}