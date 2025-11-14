import crypto from 'crypto';
import axios from 'axios';

export interface OAuthParams {
  oauth_consumer_key: string;
  oauth_nonce: string;
  oauth_signature_method: string;
  oauth_timestamp: string;
  oauth_version: string;
  oauth_callback?: string;
  oauth_token?: string;
  oauth_verifier?: string;
}

/**
 * Encode string according to RFC 3986 (OAuth 1.0a requirement)
 * JavaScript's encodeURIComponent doesn't encode: ! ' ( ) *
 * But OAuth requires all these to be percent-encoded
 */
function rfc3986Encode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

export function generateOAuthSignature(
  method: string,
  url: string,
  params: OAuthParams | Record<string, string>,
  consumerSecret: string,
  tokenSecret: string = ''
): string {
  const paramObj = params as Record<string, string>;

  // Sort and encode parameters using RFC 3986
  const sortedParams = Object.keys(paramObj)
    .sort()
    .map(key => `${rfc3986Encode(key)}=${rfc3986Encode(paramObj[key])}`)
    .join('&');

  // Build signature base string with proper encoding
  const signatureBaseString = [
    method.toUpperCase(),
    rfc3986Encode(url),
    rfc3986Encode(sortedParams)
  ].join('&');

  // Build signing key
  const signingKey = `${rfc3986Encode(consumerSecret)}&${rfc3986Encode(tokenSecret)}`;

  // Generate HMAC-SHA1 signature
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  return signature;
}

export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

export function createOAuthParams(
  consumerKey: string,
  token?: string,
  callback?: string,
  verifier?: string
): OAuthParams {
  const params: OAuthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: generateTimestamp(),
    oauth_version: '1.0'
  };

  if (callback) params.oauth_callback = callback;
  if (token) params.oauth_token = token;
  if (verifier) params.oauth_verifier = verifier;

  return params;
}

export async function makeOAuthRequest(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  tokenSecret: string = '',
  additionalParams: Record<string, string> = {}
) {
  const oauthParams = createOAuthParams(consumerKey);
  const allParams: Record<string, string> = { ...oauthParams as any, ...additionalParams };

  const signature = generateOAuthSignature(method, url, allParams, consumerSecret, tokenSecret);
  allParams.oauth_signature = signature;

  const response = await axios({
    method,
    url,
    params: allParams,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'SGS-Locations/1.0'
    },
    timeout: 30000
  });

  return response.data;
}
