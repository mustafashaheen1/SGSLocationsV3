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

export function generateOAuthSignature(
  method: string,
  url: string,
  params: OAuthParams | Record<string, string>,
  consumerSecret: string,
  tokenSecret: string = ''
): string {
  const paramObj = params as Record<string, string>;
  const sortedParams = Object.keys(paramObj)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(paramObj[key])}`)
    .join('&');

  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

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
