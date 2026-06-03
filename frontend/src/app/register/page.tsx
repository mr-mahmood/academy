'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function RegisterPage() {
    const router = useRouter()
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
    const [showEmptyState, setShowEmptyState] = useState(false) // New state for empty state delay
    const [error, setError] = useState('')
    const [registering, setRegistering] = useState<number | null>(null)

    // Reset initialStep3Load when entering step 3
    useEffect(() => {
        if (step === 3 && selectedSport && selectedGender) {
            setInitialStep3Load(true)
            setShowEmptyState(false) // Reset empty state visibility
            // Set a timeout to turn off initial load after a delay
            const timer = setTimeout(() => {
                setInitialStep3Load(false)
            }, 400)
            return () => clearTimeout(timer)
        }
    }, [step, selectedSport, selectedGender])

    // Handle empty state with delay
    useEffect(() => {
        if (!initialStep3Load && !filtering && availableCourses.length === 0 && step === 3) {
            // Add delay before showing empty state
            const timer = setTimeout(() => {
                setShowEmptyState(true)
            }, 300)
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
                    url: 'api/academy/courses/',
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

        // Add delay to show loading state and prevent flash
        const timer = setTimeout(() => {
            let filtered = [...allCourses]
            filtered = filtered.filter(course => course.sport?.id === selectedSport.id)
            filtered = filtered.filter(course => course.gender_requirement === selectedGender)
            setAvailableCourses(filtered)
            setFiltering(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [selectedSport, selectedGender, allCourses])

    const handleGenderSelect = (gender: string) => {
        setSelectedGender(gender)
        setStep(2)
        setError('')
    }

    const handleSportSelect = (sport: Sport) => {
        setSelectedSport(sport)
        setStep(3)
        setError('')
    }

    const handleBack = () => {
        if (step === 2) {
            setSelectedGender('')
            setStep(1)
        } else if (step === 3) {
            setSelectedSport(null)
            setStep(2)
        }
    }

    const handleReset = () => {
        setSelectedSport(null)
        setSelectedGender('')
        setStep(1)
        setError('')
    }

    if (loading) {
        return <LoadingSpinner />
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

                {/* Selected Options Banner */}
                <div className={styles.selectedBanner}>
                    <div className={styles.bannerTitleLine}>
                        <div className={styles.bannerTitle}>
                            <span>انتخاب‌های شما</span>
                        </div>
                    </div>
                    <div className={styles.bannerItemsLine}>
                        <div className={styles.bannerItem}>
                            <span className={styles.bannerLabel}>جنسیت:</span>
                            <span className={styles.bannerValue}>
                                {selectedGender !== '' ? (
                                    selectedGender === 'MALE' ? 'آقایان' : 'بانوان'
                                ) : (
                                    'انتخاب نشده'
                                )}
                            </span>
                        </div>
                        <div className={styles.bannerItem}>
                            <span className={styles.bannerLabel}>ورزش:</span>
                            <span className={styles.bannerValue}>{selectedSport?.name || 'انتخاب نشده'}</span>
                        </div>
                    </div>
                </div>

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
            {/* Progress Steps */}
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

            {/* Selected Options Banner */}
            <div className={styles.selectedBanner}>
                <div className={styles.bannerTitleLine}>
                    <div className={styles.bannerTitle}>
                        <span>انتخاب‌های شما</span>
                    </div>
                </div>
                <div className={styles.bannerItemsLine}>
                    <div className={styles.bannerItem}>
                        <span className={styles.bannerLabel}>جنسیت:</span>
                        <span className={styles.bannerValue}>
                            {selectedGender !== '' ? (
                                selectedGender === 'MALE' ? 'آقایان' : 'بانوان'
                            ) : (
                                'انتخاب نشده'
                            )}
                        </span>
                    </div>
                    <div className={styles.bannerItem}>
                        <span className={styles.bannerLabel}>ورزش:</span>
                        <span className={styles.bannerValue}>{selectedSport?.name || 'انتخاب نشده'}</span>
                    </div>
                </div>
                <div className={styles.bannerActionsLine}>
                    {(step === 2 || step === 3) && (
                        <button onClick={handleBack} className={styles.bannerBackButton}>
                            <Icon icon={Icons.chevronRight} />
                            <span>بازگشت</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Step 2: Select Sport */}
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

            {/* Step 3: Show Courses with Register Button */}
            {step === 3 && selectedSport && selectedGender && (
                <div className={styles.stepContainer}>
                    <div className={styles.resultsHeader}>
                        <h2 className={styles.stepTitle} style={{ textAlign: 'center' }}>دوره‌های موجود</h2>
                    </div>

                    {(initialStep3Load || filtering) ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>{initialStep3Load ? 'در حال بارگذاری...' : 'در حال جستجوی دوره‌ها...'}</p>
                        </div>
                    ) : showEmptyState && availableCourses.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Icon icon={Icons.school} />
                            <h3>دوره‌ای یافت نشد</h3>
                            <p>متاسفانه هیچ دوره‌ای با شرایط انتخاب شده وجود ندارد</p>
                        </div>
                    ) : !showEmptyState && availableCourses.length === 0 ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>در حال بررسی دوره‌ها...</p>
                        </div>
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
                                        onClick={() => router.push(`/courses/${course.id}`)}
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