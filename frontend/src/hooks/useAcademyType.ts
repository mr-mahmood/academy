// hooks/useAcademyType.ts
import { useSearchParams, usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

export type AcademyType = 'INTERNAL' | 'PARTNER_BASE' | null

export function useAcademyType() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    
    const academyType = searchParams.get('academy_type') as AcademyType
    
    const setAcademyType = (type: AcademyType) => {
        const params = new URLSearchParams(searchParams)
        if (type) {
            params.set('academy_type', type)
        } else {
            params.delete('academy_type')
        }
        router.push(`${pathname}?${params.toString()}`)
    }
    
    return { academyType, setAcademyType }
}

// Hook for getting display names
export function getAcademyTypeDisplay(type: AcademyType): string {
    switch(type) {
        case 'INTERNAL': return 'داخلی'
        case 'PARTNER_BASE': return 'پایگاه'
        default: return ''
    }
}