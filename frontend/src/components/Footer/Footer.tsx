// components/Footer.tsx
'use client'

import Link from 'next/link'
import { Icon, Icons } from '@/components/icon'
import styles from './Footer.module.css'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <div className={styles.footerSection}>
                    <div className={styles.footerLogo}>
                        <Icon icon={Icons.school} size="lg" />
                        <span>باشگاه فولاد مبارکه سپاهان</span>
                    </div>
                    <p className={styles.footerDescription}>
                        محیطی حرفه‌ای برای پرورش استعدادهای ورزشی
                    </p>
                </div>

                <div className={styles.footerLinks}>
                    <div className={styles.linkGroup}>
                        <h4>دسترسی سریع</h4>
                        <Link href="/">صفحه اصلی</Link>
                        <Link href="/courses">دوره‌ها</Link>
                        <Link href="/">درباره ما</Link>
                        <Link href="/">تماس با ما</Link>
                    </div>
                </div>

                <div className={styles.footerLinks}>
                    <div className={styles.linkGroup}>
                        <h4>قوانین</h4>
                        <Link href="/">شرایط و ضوابط</Link>
                        <Link href="/">حریم خصوصی</Link>
                    </div>
                </div>

                <div className={styles.footerLinks}>
                    <div className={styles.linkGroup}>
                        <div className={styles.contactItem}>
                            <Icon icon={Icons.phone} size="xs" />
                            <span>03137660491</span>
                        </div>
                        <div className={styles.contactItem}>
                            <Icon icon={Icons.email} size="xs" />
                            <span>info@sepahansc.com</span>
                        </div>
                        <div className={styles.contactItem}>
                            <Icon icon={Icons.location} size="xs" />
                            <span>اصفهان، خیابان آتشگاه جنب کوه آتشگاه، مجموعه فرهنگی ورزشی باغ فردوس</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.footerBottom}>
                <p>&copy; {currentYear}باشگاه فولاد مبارکه سپاهان. تمامی حقوق محفوظ است.</p>
            </div>
        </footer>
    )
}