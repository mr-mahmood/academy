export interface PaymentInitiateResponse {
    success: boolean
    data?: {
        track_id: number
        gateway_url: string
        payment_id: number
        enrollment_id: number
        res_num: string
        amount: number
    }
    message?: string
    code?: number
}