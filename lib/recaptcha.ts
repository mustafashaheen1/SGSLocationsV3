/**
 * Server-side reCAPTCHA verification helper
 */

export async function verifyRecaptcha(token: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey || secretKey === 'your_recaptcha_secret_key') {
    console.error('reCAPTCHA secret key is not configured');
    return {
      success: false,
      error: 'reCAPTCHA is not properly configured on the server'
    };
  }

  if (!token) {
    return {
      success: false,
      error: 'reCAPTCHA token is missing'
    };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return {
        success: false,
        error: 'reCAPTCHA verification failed. Please try again.'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return {
      success: false,
      error: 'Failed to verify reCAPTCHA. Please try again.'
    };
  }
}
