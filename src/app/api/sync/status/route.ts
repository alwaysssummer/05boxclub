import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

/**
 * 동기화 상태 조회
 * GET /api/sync/status
 */
export async function GET() {
  try {
    const supabase = createApiClient();
    
    // 1. 마지막 동기화 로그 조회 (sync_logs 테이블)
    const { data: lastSync, error: syncError } = await supabase
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 에러가 있고 "no rows" 에러가 아닌 경우만 throw
    if (syncError && syncError.code !== 'PGRST116') {
      console.error('[Sync Status] sync_logs 조회 오류:', syncError);
    }

    // 2. 전체 파일 통계
    const { count: totalFiles, error: filesError } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true });

    if (filesError) {
      console.error('[Sync Status] files 통계 오류:', filesError);
    }

    // 3. 교재 통계
    const { count: totalTextbooks, error: textbooksError } = await supabase
      .from('textbooks')
      .select('*', { count: 'exact', head: true });

    if (textbooksError) {
      console.error('[Sync Status] textbooks 통계 오류:', textbooksError);
    }

    // 4. 응답 형식 (프론트엔드가 기대하는 SyncStatus 인터페이스에 맞춤)
    return NextResponse.json({
      success: true,
      status: {
        is_syncing: false, // TODO: 실제 동기화 진행 상태 체크
        last_sync_at: lastSync?.started_at || null,
        last_sync_type: lastSync?.type || null,
        last_sync_status: lastSync?.status || null,
        last_sync_error: lastSync?.error_message || null,
        total_files: totalFiles || 0,
        total_textbooks: totalTextbooks || 0,
      },
    });
  } catch (error) {
    console.error('[Sync Status] 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '동기화 상태 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

