// app/courses/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useActiveUser } from '@/contexts/active_user_context'
import { useApi } from '@/hooks/useApi'
import type { Course } from '@/types/Course'
import type { Enrollment } from '@/types/enrollment'
import type { Schedule } from '@/types/Schedule'
import styles from './courseDetail.module.css'
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

// ✅ Support contact information mapping
interface SupportContact {
    name: string
    phone: string
    gender?: 'MALE' | 'FEMALE'
}

const getSupportContact = (sportName?: string, genderRequirement?: string): SupportContact | null => {
    const sport = sportName?.toLowerCase() || ''

    // Football & Futsal (Men)
    if (sport.includes('فوتبال') || sport.includes('فوتسال')) {
        return { name: 'سعید طاهری', phone: '09131860199', gender: 'MALE' }
    }

    // Men's Volleyball
    if (sport.includes('والیبال') && genderRequirement === 'MALE') {
        return { name: 'آقای شفیعی', phone: '09133687181', gender: 'MALE' }
    }

    // Women's Volleyball
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
    const [course, setCourse] = useState<Course | null>(null)
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
    const [userEnrollments, setUserEnrollments] = useState<Enrollment[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [cancelProcessing, setCancelProcessing] = useState(false)
    const [paymentProcessing, setPaymentProcessing] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showModal, setShowModal] = useState<'preRegister' | 'pay' | 'cancel' | null>(null)

    const classId = params.id as string

    // ✅ Single check for valid ID
    const isValidId = classId && classId !== 'undefined'

    // ✅ Redirect immediately if ID is invalid — no other effects should run
    useEffect(() => {
        if (!isValidId) {
            const savedCourseId = sessionStorage.getItem('payment_course_id')
            if (savedCourseId && savedCourseId !== 'undefined') {
                router.replace(`/courses/${savedCourseId}`)
            } else {
                router.replace('/dashboard')
            }
        }
    }, [isValidId, router])

    // Fetch user enrollments — only if we have a valid ID and active user
    useEffect(() => {
        if (!activeUser || !isValidId) return
        const fetchEnrollments = async () => {
            if (!activeUser) return
            const result = await apiFetch({ url: 'api/enrollment/', method: 'GET' })
            if (result.success) {
                const data = result.data?.enrollments || result.data?.enrollments || result.data || []
                setUserEnrollments(Array.isArray(data) ? data : [])
            }
        }
        fetchEnrollments()
    }, [activeUser, isValidId, router])

    // Fetch course details — only if we have a valid ID
    useEffect(() => {
        if (!isValidId) return

        const fetchCourse = async () => {
            setLoading(true)
            try {
                const result = await apiFetch({ url: `api/courses/${classId}/`, method: 'GET' })
                if (result.success) {
                    setCourse(result.data?.course || result.data as Course)
                } else {
                    setError('دوره مورد نظر یافت نشد')
                }
            } catch (err) {
                setError('خطا در بارگذاری اطلاعات دوره')
            } finally {
                setLoading(false)
            }
        }
        fetchCourse()
    }, [classId, isValidId, router])

    // Sync enrollment state with user enrollments
    useEffect(() => {
        if (!course) return

        if (userEnrollments.length > 0) {
            const found = userEnrollments.find(e => e.course?.id === course.id) || null
            setEnrollment(found)
        } else {
            setEnrollment(null)
        }
    }, [userEnrollments, course])

    const hasTimeConflict = (): boolean => {
        if (!course?.schedule?.length) return false
        return userEnrollments.some(e => {
            const ec = e.course
            if (!ec || ec.id === course.id || !ec.schedule?.length) return false
            return ec.schedule.some(es => course.schedule!.some(ns =>
                es.weekday === ns.weekday && es.start_time < ns.end_time && es.end_time > ns.start_time
            ))
        })
    }

    const isEnrolled = enrollment?.enrollment_status === 'CONFIRMED'
    const isPreRegistered = ['WAITING_FOR_PAYMENT', 'PENDING'].includes(enrollment?.enrollment_status || '')
    const canPreRegister = (): boolean => !!(course && activeUser && course.status === 'ACTIVE' && !isEnrolled && !isPreRegistered &&
        (!course.gender_requirement || course.gender_requirement === activeUser?.gender) && !hasTimeConflict())

    const getDisableReason = (): string | null => {
        if (!course || !activeUser) return null
        if (isEnrolled) return 'شما قبلاً در این دوره ثبت‌نام کرده‌اید'
        if (isPreRegistered) return 'پیش‌ ثبت‌ نام انجام شده است. برای تکمیل، پرداخت را انجام دهید'
        if (course.status !== 'ACTIVE') return 'این دوره در حال حاضر فعال نیست'
        if (course.gender_requirement && course.gender_requirement !== activeUser.gender) return 'این دوره برای جنسیت شما مناسب نیست'
        if (hasTimeConflict()) return 'تداخل زمانی با دوره‌های دیگر شما وجود دارد'
        return null
    }

    const refreshEnrollments = async () => {
        const result = await apiFetch({ url: 'api/enrollment/', method: 'GET' })
        if (result.success) {
            const data = result.data?.enrollments || result.data || []
            setUserEnrollments(Array.isArray(data) ? data : [])
        }
    }

    const handlePreRegister = async () => {
        if (!activeUser || !course) return
        setShowModal(null)
        setProcessing(true)
        setError('')

        try {
            const result = await apiFetch({ url: 'api/enrollment/', method: 'POST', body: { course_id: course.id } })
            if (result.success) {
                setSuccess('پیش‌ ثبت‌ نام با موفقیت انجام شد')
                await refreshEnrollments()
                setTimeout(() => setSuccess(''), 3000)
            } else {
                setError(result.code === 224 ? 'تداخل زمانی با دوره‌های دیگر شما' : (result.message || 'خطا در پیش ‌ثبت‌ نام'))
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
        if (!activeUser || !course || !enrollment) return
        setShowModal(null)
        setPaymentProcessing(true)

        try {
            const result = await apiFetch({
                url: 'api/payment/initiate/',
                method: 'POST',
                body: { course_id: course.id, enrollment_id: enrollment.id }
            }) as PaymentInitiateResponse

            if (result.success && result.data) {
                sessionStorage.setItem('payment_pending', 'true')
                sessionStorage.setItem('payment_course_id', String(course.id))
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
            const result = await apiFetch({ url: `api/enrollment/${enrollment.id}/`, method: 'DELETE' })

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

    // Handle payment callback when returning from Zibal
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const paymentStatus = urlParams.get('status')
        const paymentPending = sessionStorage.getItem('payment_pending')

        if (paymentStatus === 'success' && paymentPending === 'true') {
            setSuccess('پرداخت با موفقیت انجام شد. ثبت‌نام شما تکمیل گردید.')
            sessionStorage.removeItem('payment_pending')
            refreshEnrollments()
            window.history.replaceState({}, '', window.location.pathname)
            setTimeout(() => setSuccess(''), 5000)
        } else if (paymentStatus === 'failed' && paymentPending === 'true') {
            setError('پرداخت ناموفق بود. لطفاً مجدداً تلاش کنید.')
            sessionStorage.removeItem('payment_pending')
            sessionStorage.removeItem('payment_course_id')
            setTimeout(() => setError(''), 5000)
        }
    }, [])

    // Don't render anything while redirecting invalid IDs
    if (!isValidId) {
        return <LoadingSpinner />
    }

    if (isLoadingActiveUser || loading) {
        return <LoadingSpinner />
    }

    if ((error && !course) || !course) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorIcon}><Icon icon={Icons.timesCircle} /></div>
                <div><h3>خطا</h3><p>{error || 'دوره مورد نظر یافت نشد'}</p></div>
                <button onClick={() => router.push('/dashboard')} className={styles.backButton}>بازگشت</button>
            </div>
        )
    }

    const disableReason = getDisableReason()
    const enrolledCount = userEnrollments.filter(e => e.course?.id === course.id && e.enrollment_status === 'CONFIRMED').length

    // Get support contact for this course
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

    console.log('activeUser:', activeUser)
    console.log('isLoadingActiveUser:', isLoadingActiveUser)

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

            <div className={styles.courseHeaderCard}>
                <div className={styles.headerIcon}>
                    <Icon icon={Icons.football} />
                </div>
                <div className={styles.headerInfo}>
                    <h1 className={styles.courseName}>{course.sport?.name || 'دوره ورزشی'}</h1>
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
                {statusBadge && (
                    <div className={`${styles.statusBadge} ${statusBadge.class}`}>
                        <Icon icon={statusBadge.icon} /><span>{statusBadge.text}</span>
                    </div>
                )}
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
                            {course.max_students}
                        </span>
                    </div>
                </div>
                <div className={styles.infoCard}>
                    <Icon icon={Icons.user} />
                    <div>
                        <label>جنسیت</label>
                        <span>{course.gender_requirement === 'MALE' ? 'آقایان' : course.gender_requirement === 'FEMALE' ? 'بانوان' : 'مختلط'}</span>
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

            {/* ✅ Support Contact Section */}
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
                <div className={styles.priceRow}>
                    <span>تخفیف</span>
                    <span>۰ تومان</span>
                </div>
                <div className={styles.priceDivider}></div>
                <div className={styles.totalRow}>
                    <span>مبلغ قابل پرداخت</span>
                    <span>{formatPrice(course.price)} تومان</span>
                </div>
            </div>

            <div className={styles.actionsSection}>
                {isEnrolled ? (
                    <button onClick={() => setShowModal('cancel')} disabled={true} className={styles.cancelButton}>
                        {cancelProcessing ? (
                            <><span>لغو ثبت‌ نام</span> <div className={styles.smallSpinner}></div></>
                        ) : (
                            <><Icon icon={Icons.timesCircle} /><span>لغو ثبت‌ نام</span></>
                        )}
                    </button>
                ) : isPreRegistered ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <button onClick={() => setShowModal('pay')} disabled={paymentProcessing} className={styles.payButton}>
                            {paymentProcessing ? (
                                <><span>پرداخت و تکمیل ثبت‌ نام</span> <div className={styles.smallSpinner}></div></>
                            ) : (
                                <><Icon icon={Icons.creditCard} /><span>پرداخت و تکمیل ثبت‌ نام</span></>
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
                            <><span>پیش‌ ثبت ‌نام</span> <div className={styles.smallSpinner}></div></>
                        ) : (
                            <><Icon icon={Icons.edit} /><span>پیش‌ ثبت ‌نام</span></>
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
                                sessionStorage.setItem('pendingRegistration', JSON.stringify({ courseId: course.id }))
                                router.push('/login')
                            }}
                        >
                            <Icon icon={Icons.edit} /><span>پیش‌ ثبت ‌نام</span>
                        </button>
                    )
                )}
            </div>

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => !processing && !cancelProcessing && !paymentProcessing && setShowModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        {showModal === 'preRegister' && (
                            <>
                                <div className={styles.modalIcon}><Icon icon={Icons.edit} /></div>
                                <h3 className={styles.modalTitle}>تأیید پیش‌ثبت‌نام</h3>
                                <p className={styles.modalText}>آیا مایل به پیش‌ثبت‌نام در دوره "{course.sport?.name}" هستید؟</p>
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
                                <p className={styles.modalText}>برای تکمیل ثبت‌نام در دوره "{course.sport?.name}" مبلغ <strong>{formatPrice(course.price)} تومان</strong> پرداخت می‌شود</p>
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
                                <p className={styles.modalText}>آیا از لغو ثبت‌نام در دوره اطمینان دارید؟</p>
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