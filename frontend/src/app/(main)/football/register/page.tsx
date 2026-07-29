'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useApi } from '@/hooks/useApi'
import FootballTestCard from '@/components/FootballTestCard/FootballTestCard'
import AgeCategoryBadge from '@/components/AgeCategoryBadge/AgeCategoryBadge'
import type { FootballTest } from '@/types/FootballTest'
import styles from './register.module.css'
import { useActiveUser } from '@/contexts/active_user_context'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

interface Position {
    id: string
    name: string
    display_name: string
}

interface City {
    id: string
    name: string
}

export default function FootballRegisterPage() {
    const router = useRouter()
    const { activeUser } = useActiveUser()
    const { apiFetch } = useApi()

    // Wizard state
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
    const [selectedGender, setSelectedGender] = useState<string>('')
    const [selectedCity, setSelectedCity] = useState<City | null>(null)
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

    // All data
    const [allTests, setAllTests] = useState<FootballTest[]>([])
    const [positions, setPositions] = useState<Position[]>([])
    const [cities, setCities] = useState<City[]>([])

    // Filtered tests
    const [availableTests, setAvailableTests] = useState<FootballTest[]>([])

    // UI state
    const [loading, setLoading] = useState(true)
    const [filtering, setFiltering] = useState(false)
    const [initialStep4Load, setInitialStep4Load] = useState(false)
    const [showEmptyState, setShowEmptyState] = useState(false)
    const [error, setError] = useState('')
    const [isNavigating, setIsNavigating] = useState(false)

    // Get unique positions from tests
    const extractPositions = (tests: FootballTest[]): Position[] => {
        const uniquePositions = new Map<string, Position>()
        tests.forEach(test => {
            if (test.position && !uniquePositions.has(test.position)) {
                uniquePositions.set(test.position, {
                    id: test.position,
                    name: test.position,
                    display_name: test.position_display
                })
            }
        })
        return Array.from(uniquePositions.values())
    }

    // Get unique cities from tests
    const extractCities = (tests: FootballTest[]): City[] => {
        const uniqueCities = new Map<string, City>()
        tests.forEach(test => {
            if (test.academy?.city && test.academy.city_display) {
                if (!uniqueCities.has(test.academy.city)) {
                    uniqueCities.set(test.academy.city, {
                        id: test.academy.city,
                        name: test.academy.city_display
                    })
                }
            }
        })
        return Array.from(uniqueCities.values())
    }

    // Fetch all data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError('')

            try {
                const testsResult = await apiFetch({
                    url: 'api/football/courses/',
                    method: 'GET'
                })

                if (testsResult.success) {
                    const tests = testsResult.data?.courses || testsResult.data || []
                    setAllTests(Array.isArray(tests) ? tests : [])
                    setPositions(extractPositions(Array.isArray(tests) ? tests : []))
                    setCities(extractCities(Array.isArray(tests) ? tests : []))
                } else {
                    setError('خطا در دریافت اطلاعات تست‌ها')
                }
            } catch (error) {
                console.error('Error fetching data:', error)
                setError('خطا در ارتباط با سرور')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Reset initialStep4Load when entering step 4
    useEffect(() => {
        if (step === 4 && selectedGender && selectedCity && selectedPosition) {
            setInitialStep4Load(true)
            setShowEmptyState(false)
            const timer = setTimeout(() => setInitialStep4Load(false), 400)
            return () => clearTimeout(timer)
        }
    }, [step, selectedGender, selectedCity, selectedPosition])

    // Handle empty state with delay
    useEffect(() => {
        if (!initialStep4Load && !filtering && availableTests.length === 0 && step === 4) {
            const timer = setTimeout(() => setShowEmptyState(true), 300)
            return () => clearTimeout(timer)
        } else {
            setShowEmptyState(false)
        }
    }, [initialStep4Load, filtering, availableTests.length, step])

    // Filter tests based on selections
    useEffect(() => {
        if (!selectedGender || !selectedCity || !selectedPosition) {
            setAvailableTests([])
            setFiltering(false)
            return
        }

        setFiltering(true)
        const timer = setTimeout(() => {
            let filtered = [...allTests]
            filtered = filtered.filter(test => test.gender_requirement === selectedGender)
            filtered = filtered.filter(test => test.academy?.city === selectedCity.id)
            filtered = filtered.filter(test => test.position === selectedPosition.id)
            setAvailableTests(filtered)
            setFiltering(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [selectedGender, selectedCity, selectedPosition, allTests])

    // Simple back button handler - just use router.back() for step 1
    const handleBrowserBack = () => {
        if (step === 1) {
            router.back()
        } else {
            // Manually go to previous step
            if (step === 2) {
                setSelectedGender('')
                setStep(1)
            } else if (step === 3) {
                setSelectedCity(null)
                setStep(2)
            } else if (step === 4) {
                setSelectedPosition(null)
                setStep(3)
            }
        }
    }

    // Add popstate listener for browser back button
    useEffect(() => {
        const handlePopState = () => {
            if (step === 1) {
                // Allow normal browser back
                router.back()
            } else {
                // Prevent default and handle manually
                if (step === 2) {
                    setSelectedGender('')
                    setStep(1)
                } else if (step === 3) {
                    setSelectedCity(null)
                    setStep(2)
                } else if (step === 4) {
                    setSelectedPosition(null)
                    setStep(3)
                }
            }
        }

        window.addEventListener('popstate', handlePopState)

        // Push initial state only once
        if (window.history.state === null) {
            window.history.pushState({ step: 1 }, '')
        }

        return () => {
            window.removeEventListener('popstate', handlePopState)
        }
    }, [step, router])

    const handleGenderSelect = (gender: string) => {
        setSelectedGender(gender)
        setStep(2)
        setError('')
        window.history.pushState({ step: 2 }, '')
    }

    const handleCitySelect = (city: City) => {
        setSelectedCity(city)
        setStep(3)
        setError('')
        window.history.pushState({ step: 3 }, '')
    }

    const handlePositionSelect = (position: Position) => {
        setSelectedPosition(position)
        setStep(4)
        setError('')
        window.history.pushState({ step: 4 }, '')
    }

    const handleBack = () => {
        if (step === 2) {
            setSelectedGender('')
            setStep(1)
            setError('')
        } else if (step === 3) {
            setSelectedCity(null)
            setStep(2)
            setError('')
        } else if (step === 4) {
            setSelectedPosition(null)
            setStep(3)
            setError('')
        }
    }

    const handleReset = () => {
        setSelectedGender('')
        setSelectedCity(null)
        setSelectedPosition(null)
        setStep(1)
        setError('')
        // Replace history to prevent multiple back presses
        window.history.replaceState({ step: 1 }, '')
    }

    const ProgressSteps = () => (
        <div className={styles.progressContainer}>
            <div className={styles.progressSteps}>
                <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
                    <div className={styles.stepNumber}>1</div>
                    <span className={styles.stepLabel}>جنسیت</span>
                </div>
                <div className={`${styles.stepLine} ${step >= 2 ? styles.activeLine : ''}`}></div>
                <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
                    <div className={styles.stepNumber}>2</div>
                    <span className={styles.stepLabel}>شهر</span>
                </div>
                <div className={`${styles.stepLine} ${step >= 3 ? styles.activeLine : ''}`}></div>
                <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
                    <div className={styles.stepNumber}>3</div>
                    <span className={styles.stepLabel}>پست</span>
                </div>
                <div className={`${styles.stepLine} ${step >= 4 ? styles.activeLine : ''}`}></div>
                <div className={`${styles.step} ${step >= 4 ? styles.active : ''}`}>
                    <div className={styles.stepNumber}>4</div>
                    <span className={styles.stepLabel}>تست</span>
                </div>
            </div>
        </div>
    )

    if (loading) {
        return <LoadingSpinner />
    }

    if (allTests.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyTests}>
                    <Icon icon={Icons.football} />
                    <p>
                        در حال حاضر امکان ثبت نام در تست‌های فوتبال وجود ندارد.
                        لطفاً برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.
                    </p>
                </div>
            </div>
        )
    }

    // Step 1: Gender Selection
    if (step === 1) {
        return (
            <div className={styles.container}>
                <ProgressSteps />
                <div className={styles.stepContainer}>
                    <h2 className={styles.stepTitle}>جنسیت خود را انتخاب کنید</h2>
                    <div className={styles.genderOptions}>
                        <button onClick={() => handleGenderSelect('MALE')} className={styles.genderCard}>
                            <div className={styles.genderIcon}><Icon icon={Icons.user} /></div>
                            <h3 className={styles.genderTitle}>آقایان</h3>
                            <p className={styles.genderDescription}>تست‌های ویژه آقایان</p>
                            <Icon icon={Icons.arrowLeft} className={styles.genderArrow} />
                        </button>
                        {/* <button onClick={() => handleGenderSelect('FEMALE')} className={styles.genderCard}>
                            <div className={styles.genderIcon}><Icon icon={Icons.user} /></div>
                            <h3 className={styles.genderTitle}>بانوان</h3>
                            <p className={styles.genderDescription}>تست‌های ویژه بانوان</p>
                            <Icon icon={Icons.arrowLeft} className={styles.genderArrow} />
                        </button> */}
                    </div>
                </div>
            </div>
        )
    }

    // Step 2: City Selection
    if (step === 2) {
        return (
            <div className={styles.container}>
                <ProgressSteps />
                <div className={styles.stepContainer}>
                    <h2 className={styles.stepTitle}>شهر مورد نظر خود را انتخاب کنید</h2>
                    <div className={styles.optionsGrid}>
                        {cities.map((city) => (
                            <button key={city.id} onClick={() => handleCitySelect(city)} className={styles.optionCard}>
                                <div className={styles.optionIcon}><Icon icon={Icons.building} /></div>
                                <div className={styles.optionContent}>
                                    <h3 className={styles.optionTitle}>{city.name}</h3>
                                </div>
                                <Icon icon={Icons.arrowLeft} className={styles.optionArrow} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // Step 3: Position Selection
    if (step === 3) {
        return (
            <div className={styles.container}>
                <ProgressSteps />
                <div className={styles.stepContainer}>
                    <h2 className={styles.stepTitle}>پست تخصصی خود را انتخاب کنید</h2>
                    <div className={styles.optionsGrid}>
                        {positions.map((position) => (
                            <button key={position.id} onClick={() => handlePositionSelect(position)} className={styles.optionCard}>
                                <div className={styles.optionIcon}><Icon icon={Icons.football} /></div>
                                <div className={styles.optionContent}>
                                    <h3 className={styles.optionTitle}>{position.display_name}</h3>
                                </div>
                                <Icon icon={Icons.arrowLeft} className={styles.optionArrow} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // Step 4: Show Tests
    return (
        <div className={styles.container}>
            <ProgressSteps />

            <div className={styles.stepContainer}>
                <div className={styles.resultsHeader}>
                    <h2 className={styles.stepTitle} style={{ textAlign: 'center' }}>تست‌های موجود</h2>
                </div>

                <AgeCategoryBadge ageCategory={activeUser?.age_category} />

                {(initialStep4Load || filtering) ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>در حال بارگذاری</p>
                    </div>
                ) : showEmptyState && availableTests.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Icon icon={Icons.football} />
                        <h3>تستی یافت نشد</h3>
                        <p>متاسفانه هیچ تستی با شرایط انتخاب شده وجود ندارد</p>
                        <button onClick={handleReset} className={styles.bannerResetButton}>
                            <Icon icon={Icons.times} />
                            <span>شروع مجدد</span>
                        </button>
                    </div>
                ) : !showEmptyState && availableTests.length === 0 ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>در حال بارگذاری</p>
                    </div>
                ) : (
                    <div className={styles.coursesList}>
                        {availableTests.map((test) => (
                            <FootballTestCard
                                key={test.id}
                                test={test}
                                onClickUrl={`/football/courses/${test.id}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}