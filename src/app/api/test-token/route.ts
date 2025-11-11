import { NextResponse } from 'next/server';
import { getDropboxClient } from '@/lib/dropbox/client';

/**
 * Dropbox Access Token 테스트 API
 * GET /api/test-token
 */
export async function GET() {
  const results = {
    tokenExists: false,
    tokenLength: 0,
    tokenPrefix: '',
    tokenValid: false,
    accountInfo: null as any,
    tokenType: 'unknown',
    error: null as string | null,
  };

  try {
    // 1. 토큰 존재 확인
    const token = process.env.DROPBOX_ACCESS_TOKEN;
    if (!token) {
      results.error = 'DROPBOX_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다.';
      return NextResponse.json(results);
    }

    results.tokenExists = true;
    results.tokenLength = token.length;
    results.tokenPrefix = token.substring(0, 10) + '...';

    // 2. Dropbox 클라이언트로 실제 API 호출
    const dbx = getDropboxClient();
    
    try {
      // 계정 정보 조회 (토큰 유효성 검증)
      const { result } = await dbx.usersGetCurrentAccount();
      
      results.tokenValid = true;
      results.accountInfo = {
        name: result.name.display_name,
        email: result.email,
        accountId: result.account_id,
        accountType: result.account_type['.tag'],
      };

      // 3. 토큰 타입 추측
      // Long-lived token: sl.로 시작, 139자 이상
      // Short-lived token: 짧고 다른 형식
      if (token.startsWith('sl.') && token.length > 100) {
        results.tokenType = 'Long-lived (장기 토큰 - 만료 없음)';
      } else if (token.length < 100) {
        results.tokenType = 'Short-lived (단기 토큰 - 4시간 만료)';
      } else {
        results.tokenType = 'Legacy or OAuth (확인 필요)';
      }

      // 4. 토큰 권한 확인 (파일 읽기 테스트)
      try {
        const rootPath = process.env.DROPBOX_ROOT_PATH || '';
        await dbx.filesListFolder({
          path: rootPath,
          limit: 1,
        });
        results.accountInfo.fileAccess = '✅ 파일 접근 가능';
      } catch (err: any) {
        results.accountInfo.fileAccess = `❌ 파일 접근 불가: ${err.error?.error_summary || err.message}`;
      }

    } catch (apiError: any) {
      results.tokenValid = false;
      results.error = `API 호출 실패: ${apiError.error?.error_summary || apiError.message || String(apiError)}`;
      
      // 401 에러면 토큰 만료
      if (apiError.status === 401) {
        results.tokenType = 'Expired (만료됨)';
      }
    }

    return NextResponse.json({
      success: results.tokenValid,
      ...results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        ...results,
      },
      { status: 500 }
    );
  }
}


