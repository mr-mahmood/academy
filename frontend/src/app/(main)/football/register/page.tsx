'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import { useApi } from '@/hooks/useApi'
import FootballTestCard from '@/components/FootballTestCard/FootballTestCard'
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
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
    const [selectedCity, setSelectedCity] = useState<City | null>(null)

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

                    // Extract positions and cities from tests
                    const extractedPositions = extractPositions(Array.isArray(tests) ? tests : [])
                    const extractedCities = extractCities(Array.isArray(tests) ? tests : [])
                    setPositions(extractedPositions)
                    setCities(extractedCities)
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
        if (step === 4 && selectedGender && selectedPosition && selectedCity) {
            setInitialStep4Load(true)
            setShowEmptyState(false)
            const timer = setTimeout(() => {
                setInitialStep4Load(false)
            }, 400)
            return () => clearTimeout(timer)
        }
    }, [step, selectedGender, selectedPosition, selectedCity])

    // Handle empty state with delay
    useEffect(() => {
        if (!initialStep4Load && !filtering && availableTests.length === 0 && step === 4) {
            const timer = setTimeout(() => {
                setShowEmptyState(true)
            }, 300)
            return () => clearTimeout(timer)
        } else {
            setShowEmptyState(false)
        }
    }, [initialStep4Load, filtering, availableTests.length, step])

    // Filter tests based on selections
    useEffect(() => {
        if (!selectedGender || !selectedPosition || !selectedCity) {
            setAvailableTests([])
            setFiltering(false)
            return
        }

        setFiltering(true)

        const timer = setTimeout(() => {
            let filtered = [...allTests]
            filtered = filtered.filter(test => test.gender_requirement === selectedGender)
            filtered = filtered.filter(test => test.position === selectedPosition.id)
            filtered = filtered.filter(test => test.academy?.city === selectedCity.id)
            setAvailableTests(filtered)
            setFiltering(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [selectedGender, selectedPosition, selectedCity, allTests])

    const handleGenderSelect = (gender: string) => {
        setSelectedGender(gender)
        setStep(2)
        setError('')
    }

    const handlePositionSelect = (position: Position) => {
        setSelectedPosition(position)
        setStep(3)
        setError('')
    }

    const handleCitySelect = (city: City) => {
        setSelectedCity(city)
        setStep(4)
        setError('')
    }

    const handleBack = () => {
        if (step === 2) {
            setSelectedGender('')
            setStep(1)
        } else if (step === 3) {
            setSelectedPosition(null)
            setStep(2)
        } else if (step === 4) {
            setSelectedCity(null)
            setStep(3)
        }
    }

    const handleReset = () => {
        setSelectedGender('')
        setSelectedPosition(null)
        setSelectedCity(null)
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
                            <span className={styles.stepLabel}>پست</span>
                        </div>
                        <div className={styles.stepLine}></div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>3</div>
                            <span className={styles.stepLabel}>شهر</span>
                        </div>
                        <div className={styles.stepLine}></div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>4</div>
                            <span className={styles.stepLabel}>تست</span>
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
                            <span className={styles.bannerLabel}>پست:</span>
                            <span className={styles.bannerValue}>{selectedPosition?.display_name || 'انتخاب نشده'}</span>
                        </div>
                        <div className={styles.bannerItem}>
                            <span className={styles.bannerLabel}>شهر:</span>
                            <span className={styles.bannerValue}>{selectedCity?.name || 'انتخاب نشده'}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.stepContainer}>
                    <h2 className={styles.stepTitle}>جنسیت خود را انتخاب کنید</h2>

                    <div className={styles.genderOptions}>
                        <button onClick={() => handleGenderSelect('MALE')} className={styles.genderCard}>
                            <div className={styles.genderIcon}><Icon icon={Icons.user} /></div>
                            <h3 className={styles.genderTitle}>آقایان</h3>
                            <p className={styles.genderDescription}>تست‌های ویژه آقایان</p>
                            <Icon icon={Icons.arrowLeft} className={styles.genderArrow} />
                        </button>
                        <button onClick={() => handleGenderSelect('FEMALE')} className={styles.genderCard}>
                            <div className={styles.genderIcon}><Icon icon={Icons.user} /></div>
                            <h3 className={styles.genderTitle}>بانوان</h3>
                            <p className={styles.genderDescription}>تست‌های ویژه بانوان</p>
                            <Icon icon={Icons.arrowLeft} className={styles.genderArrow} />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Step 2: Position Selection
    if (step === 2) {
        return (
            <div className={styles.container}>
                <div className={styles.progressContainer}>
                    <div className={styles.progressSteps}>
                        <div className={`${styles.step} ${styles.active}`}>
                            <div className={styles.stepNumber}>1</div>
                            <span className={styles.stepLabel}>جنسیت</span>
                        </div>
                        <div className={`${styles.stepLine} ${styles.activeLine}`}></div>
                        <div className={`${styles.step} ${styles.active}`}>
                            <div className={styles.stepNumber}>2</div>
                            <span className={styles.stepLabel}>پست</span>
                        </div>
                        <div className={styles.stepLine}></div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>3</div>
                            <span className={styles.stepLabel}>شهر</span>
                        </div>
                        <div className={styles.stepLine}></div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>4</div>
                            <span className={styles.stepLabel}>تست</span>
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
                                {selectedGender === 'MALE' ? 'آقایان' : 'بانوان'}
                            </span>
                        </div>
                        <div className={styles.bannerItem}>
                            <span className={styles.bannerLabel}>پست:</span>
                            <span className={styles.bannerValue}>{selectedPosition?.display_name || 'انتخاب نشده'}</span>
                        </div>
                        <div className={styles.bannerItem}>
                            <span className={styles.bannerLabel}>شهر:</span>
                            <span className={styles.bannerValue}>{selectedCity?.name || 'انتخاب نشده'}</span>
                        </div>
                    </div>
                    <div className={styles.bannerActionsLine}>
                        <button onClick={handleBack} className={styles.bannerBackButton}>
                            <Icon icon={Icons.chevronRight} />
                            <span>بازگشت</span>
                        </button>
                    </div>
                </div>

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

    // Step 3: City Selection
    if (step === 3) {
        return (
            <div className={styles.container}>
                <div className={styles.progressContainer}>
                    <div className={styles.progressSteps}>
                        <div className={`${styles.step} ${styles.active}`}>
                            <div className={styles.stepNumber}>1</div>
                            <span className={styles.stepLabel}>جنسیت</span>
                        </div>
                        <div className={`${styles.stepLine} ${styles.activeLine}`}></div>
                        <div className={`${styles.step} ${styles.active}`}>
                            <div className={styles.stepNumber}>2</div>
                            <span className={styles.stepLabel}>پست</span>
                        </div>
                        <div className={`${styles.stepLine} ${styles.activeLine}`}></div>
                        <div className={`${styles.step} ${styles.active}`}>
                            <div className={styles.stepNumber}>3</div>
                            <span className={styles.stepLabel}>شهر</span>
                        </div>
                        <div className={styles.stepLine}></div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>4</div>
                            <span className={styles.stepLabel}>تست</span>
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
                                {selectedGender === 'MALE' ? 'آقایان' : 'بانوان'}
                            </span>
                        </div>
                        <div className={styles.bannerItem}>
                            <span className={styles.bannerLabel}>پست:</span>
                            <span className={styles.bannerValue}>{selectedPosition?.display_name || 'انتخاب نشده'}</span>
                        </div>
                        <div className={styles.bannerItem}>
                            <span className={styles.bannerLabel}>شهر:</span>
                            <span className={styles.bannerValue}>{selectedCity?.name || 'انتخاب نشده'}</span>
                        </div>
                    </div>
                    <div className={styles.bannerActionsLine}>
                        <button onClick={handleBack} className={styles.bannerBackButton}>
                            <Icon icon={Icons.chevronRight} />
                            <span>بازگشت</span>
                        </button>
                    </div>
                </div>

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

    // Step 4: Show Tests
    return (
        <div className={styles.container}>
            <div className={styles.progressContainer}>
                <div className={styles.progressSteps}>
                    <div className={`${styles.step} ${styles.active}`}>
                        <div className={styles.stepNumber}>1</div>
                        <span className={styles.stepLabel}>جنسیت</span>
                    </div>
                    <div className={`${styles.stepLine} ${styles.activeLine}`}></div>
                    <div className={`${styles.step} ${styles.active}`}>
                        <div className={styles.stepNumber}>2</div>
                        <span className={styles.stepLabel}>پست</span>
                    </div>
                    <div className={`${styles.stepLine} ${styles.activeLine}`}></div>
                    <div className={`${styles.step} ${styles.active}`}>
                        <div className={styles.stepNumber}>3</div>
                        <span className={styles.stepLabel}>شهر</span>
                    </div>
                    <div className={`${styles.stepLine} ${styles.activeLine}`}></div>
                    <div className={`${styles.step} ${styles.active}`}>
                        <div className={styles.stepNumber}>4</div>
                        <span className={styles.stepLabel}>تست</span>
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
                            {selectedGender === 'MALE' ? 'آقایان' : 'بانوان'}
                        </span>
                    </div>
                    <div className={styles.bannerItem}>
                        <span className={styles.bannerLabel}>پست:</span>
                        <span className={styles.bannerValue}>{selectedPosition?.display_name || 'انتخاب نشده'}</span>
                    </div>
                    <div className={styles.bannerItem}>
                        <span className={styles.bannerLabel}>شهر:</span>
                        <span className={styles.bannerValue}>{selectedCity?.name || 'انتخاب نشده'}</span>
                    </div>
                </div>
                <div className={styles.bannerActionsLine}>
                    <button onClick={handleBack} className={styles.bannerBackButton}>
                        <Icon icon={Icons.chevronRight} />
                        <span>بازگشت</span>
                    </button>
                    <button onClick={handleReset} className={styles.bannerResetButton}>
                        <Icon icon={Icons.times} />
                        <span>شروع مجدد</span>
                    </button>
                </div>
            </div>

            {/* Step 4: Show Tests */}
            <div className={styles.stepContainer}>
                <div className={styles.resultsHeader}>
                    <h2 className={styles.stepTitle} style={{ textAlign: 'center' }}>تست‌های موجود</h2>
                </div>

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
                        <button onClick={handleReset} className={styles.emptyStateResetBtn}>
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