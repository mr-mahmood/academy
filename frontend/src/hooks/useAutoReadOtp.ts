'use client';

import { useEffect } from 'react';

export function useAutoReadOtp(onOtpReceived: (code: string) => void) {
  useEffect(() => {
    // Check if API is supported
    if (!('OTPCredential' in window)) {
      console.log('WebOTP API not supported in this browser');
      return;
    }

    const abortController = new AbortController();

    // Request OTP from SMS
    const getOtp = async () => {
      try {
        const otp = await (navigator as any).credentials.get({
          otp: { transport: ['sms'] },
          signal: abortController.signal
        });
        
        if (otp && otp.code) {
          const cleanCode = otp.code.replace(/\D/g, '');
          if (cleanCode.length === 6) {
            onOtpReceived(cleanCode);
          }
        }
      } catch (err: any) {
        // AbortError means we cancelled intentionally
        if (err.name !== 'AbortError') {
          console.log('OTP auto-read failed:', err.message);
        }
      }
    };

    getOtp();

    // Cleanup on unmount
    return () => {
      abortController.abort();
    };
  }, [onOtpReceived]);
}