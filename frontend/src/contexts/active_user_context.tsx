// contexts/active_user_context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { UserData, getGenderInFarsi } from '@/types/userData';

interface ActiveUserContextType {
    activeUser: UserData | null;
    setActiveUser: (userData: UserData | null) => void;
    isLoadingActiveUser: boolean;
    updateUserField: <K extends keyof UserData>(field: K, value: UserData[K]) => void;
    getGenderInFarsi: (gender: string | undefined) => string;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
}

const ActiveUserContext = createContext<ActiveUserContextType | undefined>(undefined);

const ACTIVE_USER_DATA_KEY = 'currentUser';

export const ActiveUserProvider = ({ children }: { children: ReactNode }) => {
    const [activeUser, setActiveUserState] = useState<UserData | null>(null);
    const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(true);

    const setActiveUser = (userData: UserData | null) => {
        setActiveUserState(userData);
        if (userData) {
            try {
                localStorage.setItem(ACTIVE_USER_DATA_KEY, JSON.stringify(userData));
            } catch (error) {
                console.error("Failed to save active user data to localStorage:", error);
            }
        } else {
            localStorage.removeItem(ACTIVE_USER_DATA_KEY);
        }
    };

    const updateUserField = <K extends keyof UserData>(field: K, value: UserData[K]) => {
        if (activeUser) {
            const updatedUser = { ...activeUser, [field]: value };
            setActiveUser(updatedUser);
        }
    };

    const isAuthenticated = activeUser !== null;

    const refreshUser = async () => {
        try {
            // You can fetch user data from API here if needed
            const storedUserData = localStorage.getItem(ACTIVE_USER_DATA_KEY);
            if (storedUserData) {
                const parsedUserData: UserData = JSON.parse(storedUserData);
                setActiveUserState(parsedUserData);
            }
        } catch (error) {
            console.error("Failed to refresh user data:", error);
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            setIsLoadingActiveUser(true);
            try {
                const storedUserData = localStorage.getItem(ACTIVE_USER_DATA_KEY);
                if (storedUserData) {
                    const parsedUserData: UserData = JSON.parse(storedUserData);
                    setActiveUserState(parsedUserData);
                }
            } catch (error) {
                console.error("Failed to load active user data from localStorage:", error);
                localStorage.removeItem(ACTIVE_USER_DATA_KEY);
            } finally {
                setIsLoadingActiveUser(false);
            }
        };
        
        loadUser();
    }, []);

    return (
        <ActiveUserContext.Provider value={{ 
            activeUser, 
            setActiveUser, 
            isLoadingActiveUser, 
            updateUserField,
            getGenderInFarsi,
            isAuthenticated,
            refreshUser
        }}>
            {children}
        </ActiveUserContext.Provider>
    );
};

export const useActiveUser = () => {
    const context = useContext(ActiveUserContext);
    if (context === undefined) {
        throw new Error('useActiveUser must be used within an ActiveUserProvider');
    }
    return context;
};