'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface ReCaptchaProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
}

export interface ReCaptchaRef {
  reset: () => void;
  execute: () => void;
  getValue: () => string | null;
}

const ReCaptchaComponent = forwardRef<ReCaptchaRef, ReCaptchaProps>(
  ({ onVerify, onExpired, onError, theme = 'light', size = 'normal' }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    useImperativeHandle(ref, () => ({
      reset: () => {
        recaptchaRef.current?.reset();
      },
      execute: () => {
        recaptchaRef.current?.execute();
      },
      getValue: () => {
        return recaptchaRef.current?.getValue() || null;
      },
    }));

    if (!siteKey || siteKey === 'your_recaptcha_site_key_here') {
      return (
        <div className="border border-yellow-300 bg-yellow-50 p-4 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>reCAPTCHA Configuration Required:</strong> Please add your reCAPTCHA site key to .env.local
          </p>
          <p className="text-xs text-yellow-700 mt-2">
            Get your keys from:{' '}
            <a
              href="https://www.google.com/recaptcha/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google reCAPTCHA Admin
            </a>
          </p>
        </div>
      );
    }

    return (
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={siteKey}
          onChange={onVerify}
          onExpired={onExpired}
          onErrored={onError}
          theme={theme}
          size={size}
        />
      </div>
    );
  }
);

ReCaptchaComponent.displayName = 'ReCaptcha';

export default ReCaptchaComponent;
