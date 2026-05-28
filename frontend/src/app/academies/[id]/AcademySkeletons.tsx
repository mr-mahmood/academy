import styles from './AcademyDetails.module.css'

// Academy Info Skeleton
export function AcademyInfoSkeleton() {
    return (
        <div className={styles.infoTab}>
            <div className={styles.skeletonInfoCard}>
                <div className={styles.skeletonTitle}>
                    <div className={styles.skeletonPulse}></div>
                </div>
                <div className={styles.skeletonInfoGrid}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={styles.skeletonInfoItem}>
                            <div className={styles.skeletonLabel}>
                                <div className={styles.skeletonPulse}></div>
                            </div>
                            <div className={styles.skeletonValue}>
                                <div className={styles.skeletonPulse}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Academy Filter Skeleton
export function AcademyFilterSkeleton() {
    return (
        <div className={styles.filterSection}>
            <div className={styles.filterButtonSkeleton}>
                <div className={styles.skeletonPulse}></div>
            </div>
        </div>
    )
}

// Academy Courses Skeleton (matches CourseCard exactly)
export function AcademyCoursesSkeleton() {
    return (
        <div className={styles.coursesList}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={styles.skeletonCard}>
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
            ))}
        </div>
    )
}