import styles from './my-courses.module.css'

// Filter button skeleton
export function MyCoursesFilterSkeleton() {
    return (
        <div className={styles.filterSection}>
            <div className={styles.filterButtonSkeleton}></div>
        </div>
    )
}

// Individual enrollment card skeleton
export function MyCoursesCardSkeleton() {
    return (
        <div className={styles.skeletonCard}>
            {/* Status Badge Skeleton */}
            <div className={styles.skeletonStatusBadge}>
                <div className={styles.skeletonPulse}></div>
            </div>

            {/* Main Section Skeleton */}
            <div className={styles.skeletonMainSection}>
                <div className={styles.skeletonIcon}>
                    <div className={styles.skeletonPulse}></div>
                </div>
                <div className={styles.skeletonMainInfo}>
                    <div className={styles.skeletonTitle}>
                        <div className={styles.skeletonPulse}></div>
                    </div>
                    <div className={styles.skeletonSubtitle}>
                        <div className={styles.skeletonPulse}></div>
                    </div>
                </div>
            </div>

            {/* Schedule Section Skeleton */}
            <div className={styles.skeletonScheduleContainer}>
                <div className={styles.skeletonScheduleRow}>
                    <div className={styles.skeletonScheduleDay}>
                        <div className={styles.skeletonPulse}></div>
                    </div>
                    <div className={styles.skeletonScheduleTime}>
                        <div className={styles.skeletonPulse}></div>
                    </div>
                </div>
            </div>

            {/* Address Section Skeleton - with animation */}
            <div className={styles.skeletonAddressRow}>
                <div className={styles.skeletonPulse}></div>
            </div>

            {/* Bottom Section Skeleton */}
            <div className={styles.skeletonBottom}>
                <div className={styles.skeletonPrice}>
                    <div className={styles.skeletonPulse}></div>
                </div>
                <div className={styles.skeletonGenderBadge}>
                    <div className={styles.skeletonPulse}></div>
                </div>
            </div>
        </div>
    )
}

// Full enrollments grid skeleton (3 cards)
export function MyCoursesGridSkeleton() {
    return (
        <div className={styles.enrollmentsList}>
            {[1, 2, 3].map((i) => (
                <MyCoursesCardSkeleton key={i} />
            ))}
        </div>
    )
}