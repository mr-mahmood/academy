'use client'

import styles from './Spinner.module.css'

interface SpinnerProps {
    size?: 'small' | 'medium' | 'large'
}

export default function Spinner({ size = 'medium' }: SpinnerProps) {
    return (
        <span className={`${styles.spinner} ${styles[size]}`}>
            <svg className={styles.spinnerSvg} viewBox="0 0 24 24">
                <circle className={styles.spinnerCircle} cx="12" cy="12" r="9" />
                <path className={styles.spinnerPath} d="M12 3 A 9 9 0 0 1 21 12" />
            </svg>
        </span>
    )
}