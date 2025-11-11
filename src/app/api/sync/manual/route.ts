import { NextResponse } from 'next/server';
import { fullSync, incrementalSync } from '@/lib/dropbox/sync';

// Next.js 15 API Route 타임아웃 설정 (초 단위)
// 개발 환경: 무제한, Vercel Pro: 최대 300초 (5분)
export const maxDuration = 300;

/**
 * 수동 동기화 트리거
 * GET /api/sync/manual?type=full|incremental
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const syncType = searchParams.get('type') || 'incremental';

    console.log(`[Manual Sync] ${syncType} 동기화 시작`);

    let result;
    if (syncType === 'full') {
      result = await fullSync();
    } else {
      result = await incrementalSync();
    }

    return NextResponse.json({
      success: result.success,
      message: syncType === 'full' 
        ? `전체 동기화 완료: 추가 ${result.filesAdded}개, 수정 ${result.filesUpdated}개, 삭제 ${result.filesDeleted}개`
        : `증분 동기화 완료: 추가 ${result.filesAdded}개, 수정 ${result.filesUpdated}개, 삭제 ${result.filesDeleted}개`,
      data: result,
    });
  } catch (error) {
    console.error('[Manual Sync] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '동기화 중 오류가 발생했습니다.',
        error: String(error),
      },
      { status: 500 }
    );
  }
}

