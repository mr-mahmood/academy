// components/UserForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, Icons } from '@/components/icon'
import styles from '../styles/userForm.module.css'
import { useActiveUser } from '@/contexts/active_user_context'
import moment from 'moment-jalaali'
import { useApi } from '@/hooks/useApi'
import { usePopup } from '@/hooks/Popup'

// Iranian cities by province
const IRANIAN_CITIES: Record<string, string[]> = {
    'آذربایجان شرقی': ['تبریز', 'مراغه', 'مرند', 'میانه', 'اهر'],
    'آذربایجان غربی': ['ارومیه', 'خوی', 'سلماس', 'مهاباد', 'بوکان'],
    'اردبیل': ['اردبیل', 'پارس‌آباد', 'مشگین‌شهر', 'خلخال'],
    'اصفهان': ['اصفهان', 'کاشان', 'خمینی‌شهر', 'نجف‌آباد', 'شهرضا'],
    'البرز': ['کرج', 'نظرآباد', 'هشتگرد', 'طالقان'],
    'ایلام': ['ایلام', 'دهلران', 'مهران', 'ایوان'],
    'بوشهر': ['بوشهر', 'برازجان', 'کنگان', 'گناوه'],
    'تهران': ['تهران', 'ری', 'اسلامشهر', 'شهریار', 'قدس', 'ملارد'],
    'چهارمحال و بختیاری': ['شهرکرد', 'بروجن', 'فارسان', 'لردگان'],
    'خراسان جنوبی': ['بیرجند', 'قائن', 'نهبندان', 'فردوس'],
    'خراسان رضوی': ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه', 'قوچان'],
    'خراسان شمالی': ['بجنورد', 'شیروان', 'اسفراین', 'جاجرم'],
    'خوزستان': ['اهواز', 'آبادان', 'خرمشهر', 'دزفول', 'اندیمشک'],
    'زنجان': ['زنجان', 'ابهر', 'خرمدره', 'قیدار'],
    'سمنان': ['سمنان', 'شاهرود', 'دامغان', 'گرمسار'],
    'سیستان و بلوچستان': ['زاهدان', 'زابل', 'چابهار', 'ایرانشهر'],
    'فارس': ['شیراز', 'مرودشت', 'کازرون', 'فسا', 'جهرم'],
    'قزوین': ['قزوین', 'الوند', 'آبیک', 'تاکستان'],
    'قم': ['قم', 'جعفریه', 'دستجرد'],
    'کردستان': ['سنندج', 'سقز', 'مریوان', 'بانه', 'قروه'],
    'کرمان': ['کرمان', 'رفسنجان', 'سیرجان', 'بم', 'جیرفت'],
    'کرمانشاه': ['کرمانشاه', 'اسلام‌آباد غرب', 'هرسین', 'کنگاور'],
    'کهگیلویه و بویراحمد': ['یاسوج', 'گچساران', 'دوگنبدان'],
    'گلستان': ['گرگان', 'گنبد کاووس', 'علی‌آباد', 'آق‌قلا'],
    'گیلان': ['رشت', 'انزلی', 'لاهیجان', 'آستارا', 'تالش'],
    'لرستان': ['خرم‌آباد', 'بروجرد', 'دورود', 'الیگودرز'],
    'مازندران': ['ساری', 'بابل', 'آمل', 'قائم‌شهر', 'بابلسر'],
    'مرکزی': ['اراک', 'ساوه', 'خمین', 'محلات'],
    'هرمزگان': ['بندرعباس', 'قشم', 'کیش', 'میناب'],
    'همدان': ['همدان', 'ملایر', 'نهاوند', 'تویسرکان'],
    'یزد': ['یزد', 'اردکان', 'میبد', 'بافق']
}

const PROVINCES = Object.keys(IRANIAN_CITIES)

// Validation functions
const validatePersianText = (value: string, fieldName: string): string | null => {
    if (!value.trim()) return null
    const persianRegex = /^[\u0600-\u06FF\uFB8A\u067E\u0686\u06AF\u200C\s]+$/
    if (!persianRegex.test(value)) {
        return `${fieldName} باید فقط شامل حروف فارسی باشد`
    }
    return null
}

const validateNationalId = (value: string): string | null => {
    if (!value) return null
    if (!/^\d{10}$/.test(value)) return 'کد ملی باید 10 رقم باشد'
    return null
}

const validateBirthDate = (year: string, month: string, day: string): string | null => {
    if (!year || !month || !day) {
        return 'لطفاً تاریخ تولد را به صورت کامل وارد کنید'
    }

    const yearNum = parseInt(year)
    const monthNum = parseInt(month)
    const dayNum = parseInt(day)

    const currentYear = new Date().getFullYear()
    if (yearNum < 1300 || yearNum > currentYear) {
        return `سال باید بین ۱۳۰۰ تا ${currentYear} باشد`
    }

    if (monthNum < 1 || monthNum > 12) {
        return 'ماه باید بین ۱ تا ۱۲ باشد'
    }

    let maxDays = 31
    if (monthNum >= 7 && monthNum <= 11) {
        maxDays = 30
    } else if (monthNum === 12) {
        const isLeap = (yearNum + 1) % 33 === 0
        maxDays = isLeap ? 30 : 29
    }

    if (dayNum < 1 || dayNum > maxDays) {
        return `روز باید بین ۱ تا ${maxDays} باشد`
    }

    return null
}

moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false })

const convertToTimestamp = (year: string, month: string, day: string): number => {
    const convertToEnglishDigits = (str: string): string => {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
        const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
        let result = str
        persianDigits.forEach((d, i) => result = result.replace(new RegExp(d, 'g'), i.toString()))
        arabicDigits.forEach((d, i) => result = result.replace(new RegExp(d, 'g'), i.toString()))
        return result
    }

    const cleanYear = convertToEnglishDigits(year)
    const cleanMonth = convertToEnglishDigits(month)
    const cleanDay = convertToEnglishDigits(day)

    const persianDate = moment(`${cleanYear}/${cleanMonth}/${cleanDay}`, 'jYYYY/jM/jD')

    if (!persianDate.isValid()) {
        console.error('Invalid Persian date:', { cleanYear, cleanMonth, cleanDay })
        return Date.now()
    }

    return persianDate.valueOf()
}

const convertGregorianToJalali = (gregorianDate: string): { year: string; month: string; day: string } => {
    if (!gregorianDate) return { year: '', month: '', day: '' }

    try {
        const [year, month, day] = gregorianDate.split('-').map(Number)
        const jalaliDate = moment(`${year}-${month}-${day}`, 'YYYY-M-D')

        if (jalaliDate.isValid()) {
            return {
                year: jalaliDate.jYear().toString(),
                month: (jalaliDate.jMonth() + 1).toString(),
                day: jalaliDate.jDate().toString()
            }
        }
    } catch (error) {
        console.error('Error converting date:', error)
    }

    return { year: '', month: '', day: '' }
}

interface UserFormProps {
    mode: 'signup' | 'profile'
    initialPhoneNumber?: string
    onSuccess?: (user?: any) => void
}

export default function UserForm({ mode, initialPhoneNumber, onSuccess }: UserFormProps) {
    const router = useRouter()
    const { showPopUp, PopupComponent } = usePopup()

    const { activeUser, setActiveUser } = useActiveUser()
    const { apiFetch } = useApi()

    const [loading, setLoading] = useState(false)

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')

    const [formData, setFormData] = useState({
        phone_number: initialPhoneNumber || '',
        national_id: '',
        // parent_full_name: '',
        // parent_national_id: '',
        // parent_relationship: 'FATHER',
        gender: 'MALE',
        state: '',
        city: '',
        address: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [availableCities, setAvailableCities] = useState<string[]>([])

    const [birthDay, setBirthDay] = useState('')
    const [birthMonth, setBirthMonth] = useState('')
    const [birthYear, setBirthYear] = useState('')

    // Load user data for profile mode
    useEffect(() => {
        if (mode === 'profile' && activeUser) {
            const nameParts = activeUser.full_name?.split(' ') || []
            const first = nameParts[0] || ''
            const last = nameParts.slice(1).join(' ') || ''

            setFirstName(first)
            setLastName(last)

            let birthYear = '', birthMonth = '', birthDay = ''
            if (activeUser.birth_date) {
                const jalaliDate = convertGregorianToJalali(activeUser.birth_date)
                birthYear = jalaliDate.year
                birthMonth = jalaliDate.month
                birthDay = jalaliDate.day
            }

            setBirthYear(birthYear)
            setBirthMonth(birthMonth)
            setBirthDay(birthDay)

            setFormData({
                phone_number: activeUser.phone_number || '',
                national_id: activeUser.national_id || '',
                // parent_full_name: activeUser.parent_full_name || '',
                // parent_national_id: activeUser.parent_national_id || '',
                // parent_relationship: activeUser.parent_relationship || 'FATHER',
                gender: activeUser.gender || 'MALE',
                state: activeUser.state || '',
                city: activeUser.city || '',
                address: activeUser.address || ''
            })

            if (activeUser.state && IRANIAN_CITIES[activeUser.state]) {
                setAvailableCities(IRANIAN_CITIES[activeUser.state])
            }
        }
    }, [mode, activeUser])

    useEffect(() => {
        if (formData.state && IRANIAN_CITIES[formData.state]) {
            setAvailableCities(IRANIAN_CITIES[formData.state])
            if (!IRANIAN_CITIES[formData.state].includes(formData.city)) {
                setFormData(prev => ({ ...prev, city: '' }))
            }
        } else {
            setAvailableCities([])
        }
    }, [formData.state])

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        // First name validation
        if (!firstName.trim()) {
            newErrors.first_name = 'نام الزامی است'
        } else if (firstName.trim().length < 2) {
            newErrors.first_name = 'نام حداقل 2 کاراکتر باشد'
        } else {
            const persianError = validatePersianText(firstName, 'نام')
            if (persianError) newErrors.first_name = persianError
        }

        // Last name validation
        if (!lastName.trim()) {
            newErrors.last_name = 'نام خانوادگی الزامی است'
        } else if (lastName.trim().length < 2) {
            newErrors.last_name = 'نام خانوادگی حداقل 2 کاراکتر باشد'
        } else {
            const persianError = validatePersianText(lastName, 'نام خانوادگی')
            if (persianError) newErrors.last_name = persianError
        }

        // National ID validation
        if (!formData.national_id) {
            newErrors.national_id = 'کد ملی الزامی است'
        } else {
            const nationalIdError = validateNationalId(formData.national_id)
            if (nationalIdError) newErrors.national_id = nationalIdError
        }

        // Gender validation
        if (!formData.gender) {
            newErrors.gender = 'لطفاً جنسیت خود را انتخاب کنید'
        }

        // Birth date validation
        const birthDateError = validateBirthDate(birthYear, birthMonth, birthDay)
        if (birthDateError) {
            newErrors.birth_date = birthDateError
        }

        // Location validation
        if (!formData.state) {
            newErrors.state = 'لطفاً استان خود را انتخاب کنید'
        }
        if (!formData.city && formData.state) {
            newErrors.city = 'لطفاً شهر خود را انتخاب کنید'
        }

        // Address validation
        if (!formData.address.trim()) {
            newErrors.address = 'آدرس الزامی است'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const getFullName = (): string => {
        const first = firstName.trim()
        const last = lastName.trim()
        if (first && last) return `${first} ${last}`
        return first || last
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            showPopUp({
                title: 'اطلاعات نادرست است',
                message: 'لطفا اطلاعات را به درستی وارد کنید',
                type: 'error',
                duration: 5000,
                onClose: () => { },
                onAutoClose: () => { }
            })
            return
        }

        setLoading(true)

        const birthTimestamp = convertToTimestamp(birthYear, birthMonth, birthDay)

        const apiPayload: Record<string, any> = {
            full_name: getFullName(),
            national_id: formData.national_id,
            gender: formData.gender,
            birth_date_timestamp: birthTimestamp,
            state: formData.state,
            city: formData.city,
            address: formData.address
        }

        if (mode === 'signup') {
            apiPayload.phone_number = formData.phone_number
        }

        try {
            if (mode === 'profile') {
                const result = await apiFetch({
                    url: 'api/users/dashboard/',
                    method: 'PUT',
                    body: apiPayload
                })

                if (result.success) {
                    showPopUp({
                        title: 'آپدیت موفقیت آمیز',
                        message: 'پروفایل شما با موفقیت آپدیت شد',
                        type: 'success',
                        duration: 5000,
                        onClose: () => { },
                        onAutoClose: () => { }
                    })

                    if (result.data?.user) {
                        setActiveUser(result.data.user)
                    } else if (result.data.user) {
                        setActiveUser(result.data.user)
                    }

                    setTimeout(() => {
                        if (onSuccess) {
                            onSuccess()
                        }
                    }, 2000)
                } else {
                    showPopUp({
                        title: 'خطا در بروزرسانی',
                        message: 'خطایی در بروزرسانی پروفایل رخ داد',
                        type: 'error',
                        duration: 5000,
                        onClose: () => { },
                        onAutoClose: () => { }
                    })
                }
            } else {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/signup/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(apiPayload),
                    credentials: 'include',
                })

                const result = await response.json()

                if (response.ok) {
                    showPopUp({
                        title: 'ثبت نام موفق',
                        message: 'حساب کاربری شما با موفقیت ساخته شد',
                        type: 'success',
                        duration: 5000,
                        onClose: () => { },
                        onAutoClose: () => { }
                    })

                    if (result.data?.user) {
                        setActiveUser(result.data.user)
                    } else if (result.user) {
                        setActiveUser(result.user)
                    }

                    // Call onSuccess callback if provided
                    if (onSuccess) {
                        const userData = result.data?.user
                        setTimeout(() => {
                            onSuccess(userData)
                        }, 1000)
                    } else {
                        setTimeout(() => {
                            router.push('/')
                        }, 1000)
                    }
                } else {
                    if (result.code === 103) {
                        showPopUp({
                            title: 'خطا در ثبت نام',
                            message: 'شماره موبایل تایید نشده است. لطفاً دوباره وارد سایت شوید',
                            type: 'error',
                            duration: 5000,
                            onClose: () => { },
                            onAutoClose: () => { }
                        })
                    } else if (result.code === 121 || result.code === 161) {
                        showPopUp({
                            title: 'خطا در ثبت نام',
                            message: 'لطفا کد ملی خودتان را وارد کنید',
                            type: 'error',
                            duration: 5000,
                            onClose: () => { },
                            onAutoClose: () => { }
                        })
                    } else {
                        showPopUp({
                            title: 'خطا در ثبت نام',
                            message: 'خطا در ثبت نام. لطفاً دوباره تلاش کنید',
                            type: 'error',
                            duration: 5000,
                            onClose: () => { },
                            onAutoClose: () => { }
                        })
                    }
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error)
            showPopUp({
                title: 'مشکل ارتباط با سرور',
                message: 'خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.',
                type: 'error',
                duration: 5000,
                onClose: () => { },
                onAutoClose: () => { }
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.formWrapper}>
            <form onSubmit={handleSubmit} className={styles.profileForm}>
                <div className={styles.headerSection}>
                    <h2 className={styles.pageTitle} style={{ textAlign: 'center', color: 'var(--text-primary)' }}>
                        {mode === 'signup' ? 'ساخت حساب کاربری' : 'ویرایش پروفایل'}
                    </h2>
                </div>

                {/* Personal Information Section */}
                <div className={styles.sectionDivider}>
                    <span>اطلاعات شخصی</span>
                </div>

                {/* Phone Number - Only for signup */}
                {mode === 'signup' && (
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                            شماره موبایل
                            <span className={styles.requiredStar}>*</span>
                        </label>
                        <input
                            type="tel"
                            value={formData.phone_number}
                            disabled
                            className={`${styles.fieldInput} ${styles.disabledInput}`}
                            dir="ltr"
                        />
                    </div>
                )}

                {/* Name Fields */}
                <div className={styles.twoColumnGrid}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                            نام
                            <span className={styles.requiredStar}>*</span>
                        </label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="علی"
                            disabled={loading}
                            className={`${styles.fieldInput} ${errors.first_name ? styles.fieldError : ''}`}
                            dir="rtl"
                        />
                        {errors.first_name && <p className={styles.errorText}>{errors.first_name}</p>}
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                            نام خانوادگی
                            <span className={styles.requiredStar}>*</span>
                        </label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="احمدی"
                            disabled={loading}
                            className={`${styles.fieldInput} ${errors.last_name ? styles.fieldError : ''}`}
                            dir="rtl"
                        />
                        {errors.last_name && <p className={styles.errorText}>{errors.last_name}</p>}
                    </div>
                </div>

                {/* National ID and Gender */}
                <div className={styles.twoColumnGrid}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                            کد ملی
                            <span className={styles.requiredStar}>*</span>
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={formData.national_id}
                            onChange={(e) => handleChange('national_id', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="۱۲۳۴۵۶۷۸۹۰"
                            disabled={loading}
                            maxLength={10}
                            className={`${styles.fieldInput} ${errors.national_id ? styles.fieldError : ''}`}
                            dir="ltr"
                        />
                        {errors.national_id && <p className={styles.errorText}>{errors.national_id}</p>}
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                            جنسیت
                            <span className={styles.requiredStar}>*</span>
                        </label>
                        <select
                            value={formData.gender}
                            onChange={(e) => handleChange('gender', e.target.value)}
                            disabled={loading}
                            className={`${styles.fieldInput} ${styles.selectInput} ${errors.gender ? styles.fieldError : ''}`}
                        >
                            <option value="MALE">مرد</option>
                            <option value="FEMALE">زن</option>
                        </select>
                        {errors.gender && <p className={styles.errorText}>{errors.gender}</p>}
                    </div>
                </div>

                {/* Birth Date */}
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                        تاریخ تولد
                        <span className={styles.requiredStar}>*</span>
                    </label>
                    <div className={styles.birthDateGrid}>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            placeholder="روز"
                            dir="ltr"
                            value={birthDay}
                            onChange={(e) => setBirthDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
                            disabled={loading}
                            className={`${styles.birthDateInput} ${errors.birth_date ? styles.fieldError : ''}`}
                        />
                        <select
                            value={birthMonth}
                            onChange={(e) => setBirthMonth(e.target.value)}
                            disabled={loading}
                            className={`${styles.birthDateSelect} ${errors.birth_date ? styles.fieldError : ''}`}
                        >
                            <option value="">ماه</option>
                            <option value="1">فروردین</option>
                            <option value="2">اردیبهشت</option>
                            <option value="3">خرداد</option>
                            <option value="4">تیر</option>
                            <option value="5">مرداد</option>
                            <option value="6">شهریور</option>
                            <option value="7">مهر</option>
                            <option value="8">آبان</option>
                            <option value="9">آذر</option>
                            <option value="10">دی</option>
                            <option value="11">بهمن</option>
                            <option value="12">اسفند</option>
                        </select>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="سال"
                            dir="ltr"
                            value={birthYear}
                            onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            disabled={loading}
                            className={`${styles.birthDateInput} ${errors.birth_date ? styles.fieldError : ''}`}
                        />
                    </div>
                    {errors.birth_date && <p className={styles.errorText}>{errors.birth_date}</p>}
                </div>

                <div className={styles.sectionDivider}>
                    <span>محل زندگی</span>
                </div>

                {/* Location */}
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                        محل سکونت
                        <span className={styles.requiredStar}>*</span>
                    </label>
                    <div className={styles.locationGrid}>
                        <div className={styles.locationField}>
                            <select
                                value={formData.state}
                                onChange={(e) => handleChange('state', e.target.value)}
                                disabled={loading}
                                className={`${styles.fieldInput} ${styles.selectInput} ${errors.state ? styles.fieldError : ''}`}
                            >
                                <option value="">استان</option>
                                {PROVINCES.map(province => (
                                    <option key={province} value={province}>{province}</option>
                                ))}
                            </select>
                            {errors.state && <p className={styles.errorText}>{errors.state}</p>}
                        </div>
                        <div className={styles.locationField}>
                            <select
                                value={formData.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                                disabled={!formData.state || loading}
                                className={`${styles.fieldInput} ${styles.selectInput} ${errors.city ? styles.fieldError : ''}`}
                            >
                                <option value="">شهر</option>
                                {availableCities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                            {errors.city && <p className={styles.errorText}>{errors.city}</p>}
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                        آدرس
                        <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="خیابان، کوچه، پلاک..."
                        disabled={loading}
                        className={`${styles.fieldInput} ${errors.address ? styles.fieldError : ''}`}
                        dir="rtl"
                    />
                    {errors.address && <p className={styles.errorText}>{errors.address}</p>}
                </div>

                <button type="submit" disabled={loading} className={styles.submitButton}>
                    {loading ? (
                        <div className={styles.spinner}></div>
                    ) : (
                        <>
                            <span>{mode === 'signup' ? 'ثبت نام' : 'ذخیره تغییرات'}</span>
                            <Icon icon={Icons.check} />
                        </>
                    )}
                </button>
            </form>

            {PopupComponent}
        </div>
    )
}