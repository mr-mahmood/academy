import styles from './footballTests.module.css'

// Filter button skeleton
export function FilterSkeleton() {
    return (
        <div className={styles.filterSection}>
            <div className={styles.filterButtonSkeleton}></div>
        </div>
    )
}

// Individual football test card skeleton
export function FootballTestCardSkeleton() {
    return (
        <div className={styles.skeletonCard}>
            {/* Header Skeleton */}
            <div className={styles.skeletonHeader}>
                <div className={styles.skeletonPositionIcon}>
                    <div className={styles.skeletonPulse}></div>
                </div>
                <div className={styles.skeletonPositionInfo}>
                    <div className={styles.skeletonPositionTitle}>
                        <div className={styles.skeletonPulse}></div>
                    </div>
                    <div className={styles.skeletonAgeCategory}>
                        <div className={styles.skeletonPulse}></div>
                    </div>
                </div>
                <div className={styles.skeletonStatusBadge}>
                    <div className={styles.skeletonPulse}></div>
                </div>
            </div>

            {/* Academy Section Skeleton */}
            <div className={styles.skeletonAcademySection}>
                <div className={styles.skeletonPulse}></div>
            </div>

            {/* Date Section Skeleton */}
            <div className={styles.skeletonDateSection}>
                <div className={styles.skeletonPulse}></div>
            </div>

            {/* Capacity Section Skeleton */}
            <div className={styles.skeletonCapacitySection}>
                <div className={styles.skeletonPulse}></div>
            </div>

            {/* Bottom Section Skeleton */}
            <div className={styles.skeletonBottom}>
                <div className={styles.skeletonPrice}>
                    <div className={styles.skeletonPulse}></div>
                </div>
            </div>
        </div>
    )
}

// Full tests grid skeleton (6 cards)
export function FootballTestsGridSkeleton() {
    return (
        <div className={styles.testsList}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <FootballTestCardSkeleton key={i} />
            ))}
        </div>
    )
}