import { UserData } from "./userData";

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    code?: number;
    data?: T;
}

export interface RequestOtpData {
    new_user: boolean;
}

export interface VerifyOtpData {
    user?: UserData;
    phone_number?: string;
}