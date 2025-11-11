import { NextResponse } from 'next/server';
import { incrementalSync } from '@/lib/dropbox/sync';

/**
 * Cron Job을 통한 자동 동기화
 * Vercel Cron 또는 외부 스케줄러에서 5분마다 호출
 * 
 * Vercel 설정 예시 (vercel.json):
 * - schedule: "0 * * * *" (매 시간 정각)
 * - schedule: "0 0 * * *" (매일 자정)
 * - schedule: "0 12 * * *" (매일 정오)
 */
export async function GET(request: Request) {
  try {
    // 인증 토큰 확인 (선택사항 - 보안 강화)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] 자동 동기화 시작');

    const result = await incrementalSync();

    console.log('[Cron] 자동 동기화 완료:', result);

    return NextResponse.json({
      success: result.success,
      message: `자동 동기화 완료: ${result.changesProcessed}개 처리`,
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error) {
    console.error('[Cron] 자동 동기화 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '자동 동기화 중 오류가 발생했습니다.',
        error: String(error),
      },
      { status: 500 }
    );
  }
}

// POST 메서드도 지원 (외부 스케줄러용)
export async function POST(request: Request) {
  return GET(request);
}

