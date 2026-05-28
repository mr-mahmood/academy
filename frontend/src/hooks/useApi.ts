// hooks/useApi.ts
'use client'

import { useRouter } from 'next/navigation'
import { useActiveUser } from '@/contexts/active_user_context'
import { robustFetch } from '@/utils/apiFetch'
import type { RobustFetchOptions, ApiResponse } from '@/types/RobustFetch'

export function useApi() {
    const router = useRouter()
    const { setActiveUser } = useActiveUser()

    const apiFetch = async (options: RobustFetchOptions): Promise<ApiResponse> => {
        return robustFetch({
            ...options,
            router,
            setActiveUser,
        })
    }

    return { apiFetch }
}