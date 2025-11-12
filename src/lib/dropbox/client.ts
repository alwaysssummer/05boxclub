import { Dropbox } from 'dropbox';

let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.
 * 토큰이 캐시되어 있고 아직 유효하면 재사용합니다.
 */
async function getAccessToken(): Promise<string> {
  // 캐시된 토큰이 아직 유효하면 재사용 (5분 여유)
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    console.log('[Dropbox] 캐시된 Access Token 사용');
    return cachedAccessToken;
  }

  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;

  if (!refreshToken || !appKey || !appSecret) {
    throw new Error('Dropbox 환경 변수가 설정되지 않았습니다. DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, DROPBOX_APP_SECRET를 확인하세요.');
  }

  console.log('[Dropbox] Refresh Token으로 새 Access Token 발급 요청...');

  try {
    // Refresh Token으로 새 Access Token 발급
    const response = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: appKey,
        client_secret: appSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Dropbox] 토큰 갱신 실패:', errorText);
      throw new Error(`Dropbox 토큰 갱신 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('Dropbox 응답에 access_token이 없습니다.');
    }
    
    cachedAccessToken = data.access_token;
    // 만료 시간 5분 전으로 설정 (안전 마진)
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    console.log('[Dropbox] 새 Access Token 발급 성공, 만료까지:', Math.floor((tokenExpiry - Date.now()) / 1000 / 60), '분');

    // TypeScript를 위한 null 체크 후 반환
    if (!cachedAccessToken) {
      throw new Error('Access Token 저장 실패');
    }
    
    return cachedAccessToken;
  } catch (error) {
    console.error('[Dropbox] 토큰 발급 중 오류:', error);
    throw error;
  }
}

/**
 * Dropbox API 클라이언트를 반환합니다.
 * 자동으로 Access Token을 갱신하여 항상 유효한 클라이언트를 제공합니다.
 */
export function getDropboxClient(): Dropbox {
  // 동기 함수로 유지하되, Access Token은 필요할 때 갱신되도록
  // 이 방식은 기존 코드와의 호환성을 위해 유지
  const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('DROPBOX_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다. Refresh Token 방식을 사용하려면 getDropboxClientAsync()를 사용하세요.');
  }

  return new Dropbox({
    accessToken,
    fetch: fetch.bind(globalThis),
  });
}

/**
 * Refresh Token 방식으로 Dropbox 클라이언트를 반환합니다.
 * 자동으로 Access Token을 갱신합니다.
 */
export async function getDropboxClientAsync(): Promise<Dropbox> {
  const accessToken = await getAccessToken();
  return new Dropbox({
    accessToken,
    fetch: fetch.bind(globalThis),
  });
}

/**
 * 레거시: 직접 Access Token을 반환합니다.
 * 가능하면 getDropboxClientAsync()를 사용하세요.
 */
export async function getDropboxAccessToken(): Promise<string> {
  return await getAccessToken();
}

/**
 * 캐시된 토큰 재설정 (테스트용)
 */
export function resetDropboxClient() {
  cachedAccessToken = null;
  tokenExpiry = 0;
}

