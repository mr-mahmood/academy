// app/courses-streaming/Skeletons.tsx
import { Icon, Icons } from '@/components/icon'
import styles from './courses.module.css'

// Filter button skeleton
export function FilterSkeleton() {
    return (
        <div className={styles.filterSection}>
            <div className={styles.filterButtonSkeleton}></div>
        </div>
    )
}
// Individual course card skeleton (matches real CourseCard exactly)
export function CourseCardSkeleton() {
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

            {/* Schedule Section Skeleton - with animation */}
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

// Full courses grid skeleton (6 cards)
export function CoursesGridSkeleton() {
    return (
        <div className={styles.coursesList}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <CourseCardSkeleton key={i} />
            ))}
        </div>
    )
}