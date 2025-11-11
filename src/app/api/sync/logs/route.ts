import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createApiClient();

    // 최근 20개의 동기화 로그 조회
    const { data: logs, error } = await supabase
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
    });
  } catch (error) {
    console.error('[Sync Logs] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


