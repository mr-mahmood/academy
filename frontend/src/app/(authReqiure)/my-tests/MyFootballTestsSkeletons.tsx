import styles from './my-tests.module.css'

// Filter button skeleton
export function MyFootballTestsFilterSkeleton() {
    return (
        <div className={styles.filterSection}>
            <div className={styles.filterButtonSkeleton}></div>
        </div>
    )
}

// Individual enrollment card skeleton
export function MyFootballTestsCardSkeleton() {
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

            {/* Gender Section Skeleton */}
            <div className={styles.skeletonGenderSection}>
                <div className={styles.skeletonPulse}></div>
            </div>

            {/* Date Section Skeleton */}
            <div className={styles.skeletonDateSection}>
                <div className={styles.skeletonPulse}></div>
            </div>

            {/* Academy Section Skeleton */}
            <div className={styles.skeletonAcademySection}>
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

// Full enrollments grid skeleton (3 cards)
export function MyFootballTestsGridSkeleton() {
    return (
        <div className={styles.enrollmentsList}>
            {[1, 2, 3].map((i) => (
                <MyFootballTestsCardSkeleton key={i} />
            ))}
        </div>
    )
}