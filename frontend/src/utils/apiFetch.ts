// utils/apiFetch.ts
import { RobustFetchOptions, ApiResponse } from "@/types/RobustFetch";

// --- Refresh Token Function ---
const refreshToken = async (): Promise<boolean> => {
    console.log("Attempting to refresh token...");
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/refresh/`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
        });

        const data: ApiResponse = await response.json();

        if (response.ok && data.success) {
            console.log("Token refreshed successfully.");
            return true;
        } else {
            console.error("Token refresh failed. Response:", data, "Status:", response.status);
            return false;
        }
    } catch (error) {
        console.error("Error during token refresh:", error instanceof Error ? error.message : String(error));
        return false;
    }
};

// --- Logout Function ---
const handleLogout = async (setActiveUser?: (user: null) => void) => {
    console.log("Logging out and redirecting...");
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/logout/`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
        });
    } catch (error) {
        console.error("Error during logout fetch:", error instanceof Error ? error.message : String(error));
    }

    // Clear user from context if setActiveUser is provided
    if (setActiveUser) {
        setActiveUser(null);
    }

    // Clear any stored user data
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
    }
};

// --- Robust Fetch Function ---
export async function robustFetch({
    url,
    method = "GET",
    headers = {},
    body,
    maxRetries = 5,
    router,
    setActiveUser, // Add setActiveUser as a parameter
}: RobustFetchOptions & { setActiveUser?: (user: null) => void }): Promise<ApiResponse> {
    let attempt = 0;
    let response: Response | undefined = undefined;

    while (attempt <= maxRetries) {
        let shouldLogout = false;
        let shouldRetryOriginalRequest = false;
        let isAuthError = false;

        try {
            const fetchOptions: RequestInit = {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...headers,
                },
                credentials: "include",
                body: body ? JSON.stringify(body) : undefined,
            };

            // Remove body for GET/HEAD requests if it was accidentally included
            if (method === "GET") {
                delete fetchOptions.body;
            }

            response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/${url}`, fetchOptions);
            const data: ApiResponse = await response.json();
            console.log(`Original Response: ${JSON.stringify(data, null, 2)}`);

            const isSuccess = data.success === true;
            const isAuthApiError = data?.code && [1, 2, 3, 4, 5].includes(data.code);

            if (isSuccess || !isAuthApiError) {
                // Success or a non-auth API error that we don't need to retry
                return data;
            }

            // --- AUTHENTICATION ERROR HANDLING ---
            if (isAuthApiError) {
                const currentCode = data?.code;

                if (currentCode === 4) {
                    console.log("Detected access token expiry (code 4). Attempting to refresh...");
                    isAuthError = true;
                    const refreshSuccess = await refreshToken();
                    if (refreshSuccess) {
                        shouldRetryOriginalRequest = true;
                    } else {
                        shouldLogout = true;
                    }
                } else if (currentCode !== undefined && [1, 2, 3, 5].includes(currentCode)) {
                    console.error(`Detected auth issue (code ${currentCode}). Logging out.`);
                    isAuthError = true;
                    shouldLogout = true;
                }
            }

        } catch (error) {
            console.error(`Network/Fetch Error for ${url} (Attempt ${attempt + 1}/${maxRetries + 1}):`, error instanceof Error ? error.message : String(error));
            shouldRetryOriginalRequest = true;
            response = undefined;
        }

        // --- DECIDE NEXT STEP ---
        if (shouldLogout) {
            const refreshSuccess = await refreshToken();
            if (refreshSuccess) {
                shouldRetryOriginalRequest = true;
            } else {
                await handleLogout(setActiveUser);
                // Throw error to stop execution
                throw new Error("Authentication session expired. Please log in again.");
            }
        }

        if (shouldRetryOriginalRequest && attempt < maxRetries) {
            attempt++;
            console.log(`Retrying request for ${url}. Attempt ${attempt}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
        } else if (shouldRetryOriginalRequest && attempt >= maxRetries) {
            console.error(`Max retries reached for ${url}. Request failed.`);
            if (isAuthError && !await refreshToken()) {
                await handleLogout(setActiveUser);
                throw new Error("Authentication session expired after multiple retries. Please log in again.");
            }
            throw new Error(`Request to ${url} failed after ${maxRetries + 1} attempts.`);
        }

        throw new Error(`API Error with no clear cause`);
    }

    throw new Error(`RobustFetch reached an unexpected end state for ${url}.`);
}

// --- Public Fetch for non-authenticated endpoints ---
export async function publicFetch({
    url,
    method = "GET",
    headers = {},
    body,
}: RobustFetchOptions): Promise<ApiResponse> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/${url}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data: ApiResponse = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('Public API Error:', error);
        throw error;
    }
}