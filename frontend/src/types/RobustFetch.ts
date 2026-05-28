// types/RobustFetch.ts
export interface RobustFetchOptions {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "HEAD"
    headers?: Record<string, string>;
    body?: any;
    maxRetries?: number;
    router?: any;
    setActiveUser?: (user: any) => void; // Add this line
}

export interface ApiResponse<T = any> {
    success: boolean;
    code?: number;
    message?: string;
    data?: T; 
}