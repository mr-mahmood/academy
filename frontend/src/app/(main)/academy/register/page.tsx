'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useApi } from '@/hooks/useApi'
import CourseCard from '@/components/CourseCard/CourseCard'
import type { Course } from '@/types/Course'
import styles from './register.module.css'
import { useActiveUser } from '@/contexts/active_user_context'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

interface Sport {
    id: number
    name: string
}

function RegisterContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const academyType = searchParams.get('academy_type') || 'INTERNAL'
    const { activeUser } = useActiveUser()
    const { apiFetch } = useApi()

    // Wizard state
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [selectedSport, setSelectedSport] = useState<Sport | null>(null)
    const [selectedGender, setSelectedGender] = useState<string>('')

    // All data (fetched once)
    const [allCourses, setAllCourses] = useState<Course[]>([])
    const [sports, setSports] = useState<Sport[]>([])

    // Filtered courses
    const [availableCourses, setAvailableCourses] = useState<Course[]>([])

    // UI state
    const [loading, setLoading] = useState(true)
    const [filtering, setFiltering] = useState(false)
    const [initialStep3Load, setInitialStep3Load] = useState(false)
    const [showEmptyState, setShowEmptyState] = useState(false)
    const [error, setError] = useState('')
    const [registering, setRegistering] = useState<number | null>(null)

    // Handle browser back button
    useEffect(() => {
        const handlePopState = () => {
            if (step === 1) {
                router.back()
            } else {
                if (step === 2) {
                    setSelectedGender('')
                    setStep(1)
                } else if (step === 3) {
                    setSelectedSport(null)
                    setStep(2)
                }
            }
        }

        window.addEventListener('popstate', handlePopState)

        if (window.history.state === null) {
            window.history.pushState({ step: 1 }, '')
        }

        return () => {
            window.removeEventListener('popstate', handlePopState)
        }
    }, [step, router])

    // Reset initialStep3Load when entering step 3
    useEffect(() => {
        if (step === 3 && selectedSport && selectedGender) {
            setInitialStep3Load(true)
            setShowEmptyState(false)
            const timer = setTimeout(() => {
                setInitialStep3Load(false)
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [step, selectedSport, selectedGender])

    // Handle empty state with delay
    useEffect(() => {
        if (!initialStep3Load && !filtering && availableCourses.length === 0 && step === 3) {
            const timer = setTimeout(() => {
                setShowEmptyState(true)
            }, 500)
            return () => clearTimeout(timer)
        } else {
            setShowEmptyState(false)
        }
    }, [initialStep3Load, filtering, availableCourses.length, step])

    // Fetch ALL data at once on mount
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true)
            setError('')

            try {
                const coursesResult = await apiFetch({
                    url: `api/academy/courses?academy_type=${academyType}`,
                    method: 'GET'
                })

                if (coursesResult.success) {
                    const coursesData = coursesResult.data?.courses || coursesResult.data || []
                    setAllCourses(Array.isArray(coursesData) ? coursesData : [])

                    const uniqueSports = new Map<number, Sport>()
                        ; (Array.isArray(coursesData) ? coursesData : []).forEach((course: Course) => {
                            if (course.sport && !uniqueSports.has(course.sport.id)) {
                                uniqueSports.set(course.sport.id, course.sport)
                            }
                        })
                    setSports(Array.from(uniqueSports.values()))
                } else {
                    setError('خطا در دریافت اطلاعات دوره‌ها')
                }
            } catch (error) {
                console.error('Error fetching data:', error)
                setError('خطا در ارتباط با سرور')
            } finally {
                setLoading(false)
            }
        }

        fetchAllData()
    }, [router])

    // Filter courses based on selections with delay
    useEffect(() => {
        if (!selectedSport || !selectedGender) {
            setAvailableCourses([])
            setFiltering(false)
            return
        }

        setFiltering(true)

        const timer = setTimeout(() => {
            let filtered = [...allCourses]
            filtered = filtered.filter(course => course.sport?.id === selectedSport.id)
            filtered = filtered.filter(course => course.gender_requirement === selectedGender)
            setAvailableCourses(filtered)
            setFiltering(false)
        }, 200)

        return () => clearTimeout(timer)
    }, [selectedSport, selectedGender, allCourses])

    const handleGenderSelect = (gender: string) => {
        setSelectedGender(gender)
        setStep(2)
        setError('')
        window.history.pushState({ step: 2 }, '')
    }

    const handleSportSelect = (sport: Sport) => {
        setSelectedSport(sport)
        setStep(3)
        setError('')
        window.history.pushState({ step: 3 }, '')
    }

    // Step 1: Gender Selection
    if (step === 1) {
        return (
            <div className={styles.container}>
                <div className={styles.progressContainer}>
                    <div className={styles.progressSteps}>
                        <div className={`${styles.step} ${styles.active}`}>
                            <div className={styles.stepNumber}>1</div>
                            <span className={styles.stepLabel}>جنسیت</span>
                        </div>
                        <div className={styles.stepLine}></div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>2</div>
                            <span className={styles.stepLabel}>ورزش</span>
                        </div>
                        <div className={styles.stepLine}></div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>3</div>
                            <span className={styles.stepLabel}>دوره</span>
                        </div>
                    </div>
                </div>

                {/* <div className={styles.selectedBanner}>
                    <div style={{ textAlign: 'center' }}>
                        <span className={styles.bannerTitle}>انتخاب‌های شما</span>
                    </div>

                    <div className={styles.bannerTable}>
                        <div className={styles.bannerRow}>
                            <span className={styles.bannerLabel}>جنسیت:</span>
                            <span className={styles.bannerValue}>
                                {selectedGender !== '' ? (
                                    selectedGender === 'MALE' ? 'آقایان' : 'بانوان'
                                ) : (
                                    'انتخاب نشده'
                                )}
                            </span>
                        </div>
                        <div className={styles.bannerRow}>
                            <span className={styles.bannerLabel}>ورزش:</span>
                            <span className={styles.bannerValue}>{selectedSport?.name || 'انتخاب نشده'}</span>
                        </div>
                    </div>
                </div> */}

                <div className={styles.stepContainer}>
                    <h2 className={styles.stepTitle}>جنسیت خود را انتخاب کنید</h2>

                    <div className={styles.genderOptions}>
                        <button onClick={() => handleGenderSelect('MALE')} className={styles.genderCard}>
                            <div className={styles.genderIcon}><Icon icon={Icons.user} /></div>
                            <h3 className={styles.genderTitle}>آقایان</h3>
                            <p className={styles.genderDescription}>دوره‌های ویژه آقایان</p>
                            <Icon icon={Icons.arrowLeft} className={styles.genderArrow} />
                        </button>
                        <button onClick={() => handleGenderSelect('FEMALE')} className={styles.genderCard}>
                            <div className={styles.genderIcon}><Icon icon={Icons.user} /></div>
                            <h3 className={styles.genderTitle}>بانوان</h3>
                            <p className={styles.genderDescription}>دوره‌های ویژه بانوان</p>
                            <Icon icon={Icons.arrowLeft} className={styles.genderArrow} />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.progressContainer}>
                <div className={styles.progressSteps}>
                    <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
                        <div className={styles.stepNumber}>1</div>
                        <span className={styles.stepLabel}>جنسیت</span>
                    </div>
                    <div className={`${styles.stepLine} ${step >= 2 ? styles.activeLine : ''}`}></div>
                    <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
                        <div className={styles.stepNumber}>2</div>
                        <span className={styles.stepLabel}>ورزش</span>
                    </div>
                    <div className={`${styles.stepLine} ${step >= 3 ? styles.activeLine : ''}`}></div>
                    <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
                        <div className={styles.stepNumber}>3</div>
                        <span className={styles.stepLabel}>دوره</span>
                    </div>
                </div>
            </div>

            {/* <div className={styles.selectedBanner}>
                <div style={{ textAlign: 'center' }}>
                    <span className={styles.bannerTitle}>انتخاب‌های شما</span>
                </div>

                <div className={styles.bannerTable}>
                    <div className={styles.bannerRow}>
                        <span className={styles.bannerLabel}>جنسیت:</span>
                        <span className={styles.bannerValue}>
                            {selectedGender !== '' ? (
                                selectedGender === 'MALE' ? 'آقایان' : 'بانوان'
                            ) : (
                                'انتخاب نشده'
                            )}
                        </span>
                    </div>
                    <div className={styles.bannerRow}>
                        <span className={styles.bannerLabel}>ورزش:</span>
                        <span className={styles.bannerValue}>{selectedSport?.name || 'انتخاب نشده'}</span>
                    </div>
                </div>

                <div className={styles.bannerActionsLine}>
                    <button onClick={handleBack} className={styles.bannerBackButton}>
                        <Icon icon={Icons.chevronRight} />
                        <span>بازگشت</span>
                    </button>
                    {step === 3 && (
                        <button onClick={handleReset} className={styles.bannerResetButton}>
                            <Icon icon={Icons.times} />
                            <span>شروع مجدد</span>
                        </button>
                    )}
                </div>
            </div> */}

            {step === 2 && (
                <div className={styles.stepContainer}>
                    <h2 className={styles.stepTitle}>ورزش مورد نظر خود را انتخاب کنید</h2>
                    <div className={styles.optionsGrid}>
                        {sports.map((sport) => (
                            <button key={sport.id} onClick={() => handleSportSelect(sport)} className={styles.optionCard}>
                                <div className={styles.optionIcon}><Icon icon={Icons.football} /></div>
                                <div className={styles.optionContent}>
                                    <h3 className={styles.optionTitle}>{sport.name}</h3>
                                </div>
                                <Icon icon={Icons.arrowLeft} className={styles.optionArrow} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 3 && selectedSport && selectedGender && (
                <div className={styles.stepContainer}>
                    <div className={styles.resultsHeader}>
                        <h2 className={styles.stepTitle} style={{ textAlign: 'center' }}>دوره‌های موجود</h2>
                    </div>

                    {(initialStep3Load || filtering) ? (
                        <LoadingSpinner />
                    ) : showEmptyState && availableCourses.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Icon icon={Icons.school} />
                            <h3>دوره‌ای یافت نشد</h3>
                            <p>متاسفانه هیچ دوره‌ای با شرایط انتخاب شده وجود ندارد</p>
                        </div>
                    ) : !showEmptyState && availableCourses.length === 0 ? (
                        <LoadingSpinner />
                    ) : (
                        <div className={styles.coursesList}>
                            {availableCourses.map((course) => (
                                <div key={course.id} className={styles.courseWithButton}>
                                    <CourseCard
                                        id={course.id}
                                        sport={course.sport}
                                        academy={course.academy}
                                        schedule={course.schedule}
                                        totalSessions={course.total_sessions}
                                        price={course.price}
                                        gender={course.gender_requirement}
                                        status={course.status}
                                        showAddress={true}
                                        showSessions={true}
                                        onClickUrl={`/academy/courses/${course.id}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <RegisterContent />
        </Suspense>
    )
}