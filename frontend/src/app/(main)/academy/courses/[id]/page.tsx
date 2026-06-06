// app/courses/[id]/page.tsx
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

    let statusBadge = null
    if (isEnrolled) {
        statusBadge = { text: 'ثبت‌نام قطعی', class: styles.confirmedBadge, icon: Icons.check }
    } else if (isPreRegistered) {
        statusBadge = { text: 'در انتظار پرداخت', class: styles.pendingBadge, icon: Icons.clock }
    } else {
        statusBadge = { text: 'ثبت‌ نام نشده', class: styles.notRegisteredBadge, icon: Icons.infoCircle }
    }

    function getDayName(weekday: number): string {
        const days: Record<number, string> = { 0: 'شنبه', 1: 'یکشنبه', 2: 'دوشنبه', 3: 'سه‌شنبه', 4: 'چهارشنبه', 5: 'پنجشنبه', 6: 'جمعه' }
        return days[weekday] || String(weekday)
    }

    function formatPrice(price: string | number): string {
        return (Number(price) / 10).toLocaleString()
    }

    return (
        <div className={styles.container}>
            <div className={styles.courseHeaderCard}>
                <div className={styles.headerIcon}>
                    <Icon icon={Icons.football} />
                </div>
                <div className={styles.headerInfo}>
                    <div className={styles.headerTopRow}>
                        <h1 className={styles.courseName}>{course.sport?.name || 'دوره ورزشی'}</h1>
                        {statusBadge && (
                            <div className={`${styles.statusBadge} ${statusBadge.class}`}>
                                <Icon icon={statusBadge.icon} />
                                <span>{statusBadge.text}</span>
                            </div>
                        )}
                    </div>
                    {course.academy && (
                        <>
                            <p className={styles.academyName}>ورزشگاه {course.academy.name}</p>
                            {course.academy.address_text && (
                                <div className={styles.addressRow}>
                                    <Icon icon={Icons.location} className={styles.addressIcon} />
                                    <span>{course.academy.address_text}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {course.schedule && course.schedule.length > 0 && (
                <div className={styles.scheduleCard}>
                    <h3 className={styles.cardTitle}>زمان برگزاری</h3>
                    <div className={styles.scheduleContainer}>
                        {course.schedule.map((sched: Schedule, index: number) => (
                            <div key={sched.id || index} className={styles.scheduleRow}>
                                <div className={styles.scheduleDay}>
                                    <Icon icon={Icons.calendar} className={styles.scheduleIcon} />
                                    <span>{getDayName(sched.weekday)}</span>
                                </div>
                                <div className={styles.scheduleTime}>
                                    <Icon icon={Icons.clock} className={styles.scheduleIcon} />
                                    <span>{sched.start_time?.slice(0, 5)} - {sched.end_time?.slice(0, 5)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                    <Icon icon={Icons.users} />
                    <div>
                        <label>ظرفیت</label>
                        <span className={styles.capacityValue}>
                            {course.max_students} نفر
                        </span>
                    </div>
                </div>
                <div className={styles.infoCard}>
                    <Icon icon={Icons.user} />
                    <div>
                        <label>جنسیت</label>
                        <span>{course.gender_requirement === 'MALE' ? 'آقایان' : course.gender_requirement === 'FEMALE' ? 'بانوان' : 'نامشخص'}</span>
                    </div>
                </div>
                <div className={styles.infoCard}>
                    <Icon icon={Icons.info} />
                    <div>
                        <label>تعداد جلسات</label>
                        <span>{course.total_sessions || 0} جلسه</span>
                    </div>
                </div>
                <div className={styles.infoCard}>
                    <Icon icon={Icons.verified} />
                    <div>
                        <label>وضعیت دوره</label>
                        <span className={course.status === 'ACTIVE' ? styles.activeStatus : styles.inactiveStatus}>
                            {course.status === 'ACTIVE' ? 'فعال' : course.status === 'FULL' ? 'تکمیل' : course.status === 'CANCELLED' ? 'لغو شده' : 'پایان یافته'}
                        </span>
                    </div>
                </div>
            </div>

            {supportContact && (
                <div className={styles.supportCard}>
                    <div className={styles.supportHeader}>
                        <Icon icon={Icons.phone} />
                        <h3 className={styles.cardTitle2}>شماره پشتیبانی</h3>
                    </div>
                    <div className={styles.supportContent}>
                        <div className={styles.supportInfo}>
                            <span className={styles.supportLabel}>کارشناس:</span>
                            <span className={styles.supportName}>{supportContact.name}</span>
                        </div>
                        <div className={styles.supportInfo}>
                            <a href={`tel:${supportContact.phone}`} className={styles.supportPhone}>
                                <Icon icon={Icons.phone} />
                                {supportContact.phone}
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.priceCard}>
                <div className={styles.priceRow}>
                    <span>شهریه دوره</span>
                    <span>{formatPrice(course.price)} تومان</span>
                </div>
                <div className={styles.priceDivider}></div>
                <div className={styles.totalRow}>
                    <span>مبلغ قابل پرداخت</span>
                    <span>{formatPrice(course.price)} تومان</span>
                </div>
            </div>

            <div className={styles.actionsSection}>
                {isEnrolled ? (
                    <button onClick={() => setShowModal('cancel')} className={styles.cancelButton}>
                        <Icon icon={Icons.timesCircle} /><span>لغو ثبت‌ نام</span>
                    </button>
                ) : isPreRegistered ? (
                    <>
                        <button onClick={() => setShowModal('pay')} disabled={paymentProcessing} className={styles.registerButton}>
                            {paymentProcessing ? (
                                <><span>پرداخت و تکمیل ثبت‌ نام</span> <div className={styles.smallSpinner}></div></>
                            ) : (
                                <><Icon icon={Icons.creditCard} /><span>پرداخت و تکمیل ثبت‌ نام</span></>
                            )}
                        </button>
                        <button onClick={() => setShowModal('cancel')} disabled={cancelProcessing} className={styles.cancelButton}>
                            {cancelProcessing ? (
                                <><span>لغو ثبت‌ نام</span> <div className={styles.smallSpinner}></div></>
                            ) : (
                                <><Icon icon={Icons.timesCircle} /><span>لغو ثبت‌ نام</span></>
                            )}
                        </button>
                    </>
                ) : canPreRegister() ? (
                    <button onClick={() => setShowModal('preRegister')} disabled={preRegistering} className={styles.registerButton}>
                        {preRegistering ? (
                            <><span>پیش‌ ثبت‌ نام</span> <div className={styles.smallSpinner}></div></>
                        ) : (
                            <><Icon icon={Icons.edit} /><span>پیش‌ ثبت‌ نام</span></>
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
                                sessionStorage.setItem('pendingRegistration', JSON.stringify({ courseId: course.id, parent: "academy" }))
                                router.push('/login')
                            }}
                        >
                            <Icon icon={Icons.edit} /><span>ورود و پیش‌ ثبت‌ نام</span>
                        </button>
                    )
                )}
            </div>

            {showModal === 'preRegister' && (
                <div className={styles.modalOverlay} onClick={() => !preRegistering && setShowModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalIcon}><Icon icon={Icons.edit} /></div>
                        <h3 className={styles.modalTitle}>تأیید پیش‌ ثبت‌ نام</h3>
                        <p className={styles.modalText}>
                            آیا مایل به پیش‌ ثبت‌ نام در دوره هستید؟
                        </p>
                        <div className={styles.modalWarning}>
                            <Icon icon={Icons.infoCircle} />
                            <span>پس از پیش‌ ثبت‌ نام، برای تکمیل باید پرداخت را انجام دهید</span>
                        </div>
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowModal(null)} disabled={preRegistering} className={styles.modalCancelBtn}>
                                انصراف
                            </button>
                            <button onClick={handlePreRegister} disabled={preRegistering} className={styles.modalConfirmBtn}>
                                {preRegistering ? <div className={styles.smallSpinner}></div> : 'تأیید'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal === 'pay' && (
                <div className={styles.modalOverlay} onClick={() => !paymentProcessing && setShowModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalIcon}><Icon icon={Icons.creditCard} /></div>
                        <h3 className={styles.modalTitle}>تأیید پرداخت</h3>
                        <p className={styles.modalText}>
                            برای تکمیل ثبت‌ نام در دوره مبلغ <strong>{formatPrice(course.price)} تومان</strong> پرداخت می‌شود
                        </p>
                        <div className={styles.modalWarning}>
                            <Icon icon={Icons.infoCircle} />
                            <span>این عملیات غیرقابل بازگشت است</span>
                        </div>
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowModal(null)} disabled={paymentProcessing} className={styles.modalCancelBtn}>
                                انصراف
                            </button>
                            <button onClick={handlePayment} disabled={paymentProcessing} className={styles.modalConfirmBtn}>
                                {paymentProcessing ? <div className={styles.smallSpinner}></div> : 'پرداخت'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal === 'cancel' && (
                <div className={styles.modalOverlay} onClick={() => !cancelProcessing && setShowModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalIcon}><Icon icon={Icons.timesCircle} /></div>
                        <h3 className={styles.modalTitle}>لغو ثبت‌ نام</h3>
                        <p className={styles.modalText}>آیا از لغو ثبت‌ نام در دوره اطمینان دارید؟</p>
                        <div className={styles.modalWarning}>
                            <Icon icon={Icons.infoCircle} />
                            <span>در صورت لغو ثبت نام وجه پرداختی شما غیر قابل بازگشت است</span>
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