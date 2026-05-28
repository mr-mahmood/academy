// components/icon/index.tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUser, faSearch, faDashboard, faReceipt, faRightFromBracket,
    faLocationDot, faStar, faCircleCheck, faCircleInfo, faClock,
    faPhone, faEnvelope, faLock, faEye, faEyeSlash, faArrowLeft,
    faArrowRight, faCheck, faTimes, faSpinner, faHome, faSchool,
    faBuilding, faParking, faUtensils, faShirt, faMosque,
    faTree, faHeartbeat, faToilet, faShower, faPeopleGroup,
    faCalendar, faTrophy, faMedal, faFire, faGear, faRightToBracket,
    faFutbol, faBasketball, faVolleyball, faSwimmer, faPen,
    faDumbbell, faMoon, faSun, faTag, faTicket, faTimesCircle,
    faUsers, faInfoCircle, faEdit, faCreditCard, faChevronRight, faChevronLeft,
    faChevronUp, faChevronDown, faBell, faUserCheck, faFilter, faWarning,
    faRefresh

} from '@fortawesome/free-solid-svg-icons'

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

interface IconProps {
    icon: IconDefinition
    className?: string
    style?: React.CSSProperties
    spin?: boolean
    spinPulse?: boolean
    size?: '2xs' | 'xs' | 'sm' | 'lg' | 'xl' | '2xl' | '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x'
}

export function Icon({ icon, className = '', style = {}, spin = false, spinPulse = false, size = '1x' }: IconProps) {
    return (
        <FontAwesomeIcon
            icon={icon}
            className={className}
            style={style as any}
            spin={spin}
            spinPulse={spinPulse}
            size={size as any}
        />
    )
}

// Export all icons for easy access
export const Icons = {
    user: faUser,
    search: faSearch,
    dashboard: faDashboard,
    receipt: faReceipt,
    logout: faRightFromBracket,
    location: faLocationDot,
    star: faStar,
    verified: faCircleCheck,
    info: faCircleInfo,
    infoCircle: faInfoCircle,
    clock: faClock,
    phone: faPhone,
    email: faEnvelope,
    lock: faLock,
    eye: faEye,
    eyeSlash: faEyeSlash,
    arrowLeft: faArrowLeft,
    arrowRight: faArrowRight,
    check: faCheck,
    times: faTimes,
    timesCircle: faTimesCircle,
    spinner: faSpinner,
    home: faHome,
    school: faSchool,
    building: faBuilding,
    calendar: faCalendar,
    trophy: faTrophy,
    medal: faMedal,
    fire: faFire,
    settings: faGear,
    login: faRightToBracket,
    edit: faEdit || faPen,
    creditCard: faCreditCard,
    pen: faPen,
    sun: faSun,
    moon: faMoon,
    // New icons for academy
    tag: faTag,
    ticket: faTicket,
    users: faUsers,
    // Sports icons
    football: faFutbol,
    basketball: faBasketball,
    volleyball: faVolleyball,
    swimming: faSwimmer,
    fitness: faDumbbell,

    chevronLeft: faChevronLeft,
    chevronRight: faChevronRight,
    chevronUp: faChevronUp,
    chevronDown: faChevronDown,

    notification: faBell,
    userCheck: faUserCheck,

    filter: faFilter,
    refresh: faRefresh,
    warning: faWarning
}