import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

/**
 * 동기화 로그 및 파일 현황 조회
 * GET /api/test-logs
 */
export async function GET() {
  try {
    const supabase = createApiClient();
    
    // 최근 동기화 로그 10개 가져오기
    const { data: logs, error: logsError } = await supabase
      .from('dropbox_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (logsError) throw logsError;
    
    // 파일 개수 가져오기
    const { count, error: countError } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    return NextResponse.json({
      success: true,
      logs: logs || [],
      fileCount: count || 0,
    });
  } catch (error) {
    console.error('[Test Logs] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}




