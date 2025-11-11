import { NextResponse } from 'next/server';
import { getDropboxClient } from '@/lib/dropbox/client';

/**
 * Dropbox 연결 테스트 API
 * GET /api/test-dropbox-connection
 */
export async function GET() {
  const tests = {
    accessToken: false,
    clientInitialized: false,
    rootPathAccess: false,
    fileListAccess: false,
    temporaryLinkAccess: false,
    details: {} as any,
    errors: [] as string[],
  };

  try {
    // 1. Access Token 확인
    const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
    if (accessToken) {
      tests.accessToken = true;
      tests.details.tokenLength = accessToken.length;
      tests.details.tokenPrefix = accessToken.substring(0, 10) + '...';
    } else {
      tests.errors.push('DROPBOX_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다.');
    }

    // 2. Dropbox 클라이언트 초기화
    try {
      const dbx = getDropboxClient();
      tests.clientInitialized = true;
      tests.details.clientType = typeof dbx;
    } catch (error) {
      tests.errors.push(`클라이언트 초기화 실패: ${error instanceof Error ? error.message : String(error)}`);
      return NextResponse.json(tests);
    }

    const dbx = getDropboxClient();

    // 3. 루트 경로 접근 테스트
    const rootPath = process.env.DROPBOX_ROOT_PATH || '';
    tests.details.rootPath = rootPath;

    try {
      const { result } = await dbx.filesListFolder({
        path: rootPath,
        recursive: false,
        limit: 10,
      });
      
      tests.rootPathAccess = true;
      tests.details.rootFolderEntries = result.entries.length;
      tests.details.firstEntries = result.entries.slice(0, 5).map(e => ({
        name: e.name,
        type: e['.tag'],
      }));
    } catch (error: any) {
      tests.errors.push(`루트 경로 접근 실패: ${error.error?.error_summary || error.message || String(error)}`);
    }

    // 4. 파일 목록 가져오기 테스트
    try {
      const { result } = await dbx.filesListFolder({
        path: rootPath,
        recursive: true,
        limit: 100,
      });
      
      const pdfFiles = result.entries.filter(
        e => e['.tag'] === 'file' && e.name.toLowerCase().endsWith('.pdf')
      );
      
      tests.fileListAccess = true;
      tests.details.totalEntries = result.entries.length;
      tests.details.pdfFiles = pdfFiles.length;
      tests.details.samplePdfFiles = pdfFiles.slice(0, 3).map((f: any) => ({
        name: f.name,
        path: f.path_display,
        size: f.size,
      }));
    } catch (error: any) {
      tests.errors.push(`파일 목록 가져오기 실패: ${error.error?.error_summary || error.message || String(error)}`);
    }

    // 5. 임시 링크 생성 테스트 (첫 번째 PDF 파일로)
    if (tests.details.samplePdfFiles && tests.details.samplePdfFiles.length > 0) {
      const testFile = tests.details.samplePdfFiles[0];
      try {
        const { result } = await dbx.filesGetTemporaryLink({
          path: testFile.path,
        });
        
        tests.temporaryLinkAccess = true;
        tests.details.temporaryLinkTest = {
          file: testFile.name,
          linkPrefix: result.link.substring(0, 50) + '...',
          metadata: {
            name: result.metadata.name,
            size: result.metadata.size,
          },
        };
      } catch (error: any) {
        tests.errors.push(`임시 링크 생성 실패: ${error.error?.error_summary || error.message || String(error)}`);
      }
    }

    // 최종 결과
    const allPassed = tests.accessToken && 
                      tests.clientInitialized && 
                      tests.rootPathAccess && 
                      tests.fileListAccess && 
                      tests.temporaryLinkAccess;

    return NextResponse.json({
      success: allPassed,
      summary: {
        passed: [
          tests.accessToken && '✅ Access Token 설정됨',
          tests.clientInitialized && '✅ Dropbox 클라이언트 초기화 성공',
          tests.rootPathAccess && '✅ 루트 경로 접근 가능',
          tests.fileListAccess && '✅ 파일 목록 가져오기 성공',
          tests.temporaryLinkAccess && '✅ 임시 링크 생성 성공',
        ].filter(Boolean),
        failed: [
          !tests.accessToken && '❌ Access Token 미설정',
          !tests.clientInitialized && '❌ 클라이언트 초기화 실패',
          !tests.rootPathAccess && '❌ 루트 경로 접근 불가',
          !tests.fileListAccess && '❌ 파일 목록 가져오기 실패',
          !tests.temporaryLinkAccess && '❌ 임시 링크 생성 실패',
        ].filter(Boolean),
      },
      tests,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        tests,
      },
      { status: 500 }
    );
  }
}


