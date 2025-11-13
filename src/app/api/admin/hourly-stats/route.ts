import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * GET /api/admin/hourly-stats
 * 시간대별 접속 통계 (그래프용 데이터)
 * 
 * Query Parameters:
 * - date: YYYY-MM-DD (기본값: 오늘)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // TODO: 관리자 권한 체크 (Phase 6에서 구현)
    
    const supabase = createApiClient();

    // 날짜 설정 - 한국 시간대(KST, UTC+9) 기준
    const KST_OFFSET = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
    let kstTargetDate: Date;
    
    if (dateParam) {
      // YYYY-MM-DD 형식의 날짜를 KST 기준으로 파싱
      kstTargetDate = new Date(dateParam + 'T00:00:00+09:00');
    } else {
      const now = new Date();
      const kstNow = new Date(now.getTime() + KST_OFFSET);
      kstTargetDate = new Date(kstNow);
      kstTargetDate.setUTCHours(0, 0, 0, 0);
    }

    // KST 기준 시작/종료 시간
    const startDate = new Date(kstTargetDate);
    startDate.setUTCHours(0, 0, 0, 0);
    
    const endDate = new Date(kstTargetDate);
    endDate.setUTCHours(23, 59, 59, 999);
    
    // UTC로 변환
    const utcStartDate = new Date(startDate.getTime() - KST_OFFSET);
    const utcEndDate = new Date(endDate.getTime() - KST_OFFSET);

    // 해당 날짜의 모든 클릭 조회
    const { data: clicks, error: clicksError } = await supabase
      .from('file_clicks')
      .select('clicked_at')
      .gte('clicked_at', utcStartDate.toISOString())
      .lte('clicked_at', utcEndDate.toISOString())
      .order('clicked_at', { ascending: true });

    if (clicksError) {
      throw clicksError;
    }

    // 시간대별로 그룹화 (0시~23시, KST 기준)
    const hourlyData: { hour: number; count: number }[] = [];
    const hourCounts = new Array(24).fill(0);

    clicks?.forEach(click => {
      const utcDate = new Date(click.clicked_at);
      const kstDate = new Date(utcDate.getTime() + KST_OFFSET);
      const hour = kstDate.getUTCHours();
      hourCounts[hour]++;
    });

    // 결과 포맷
    for (let hour = 0; hour < 24; hour++) {
      hourlyData.push({
        hour,
        count: hourCounts[hour],
      });
    }

    // 총 클릭 수
    const totalClicks = clicks?.length || 0;

    // 피크 시간대 찾기
    const maxCount = Math.max(...hourCounts);
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count === maxCount)
      .map(h => h.hour);

    return NextResponse.json({
      success: true,
      date: kstTargetDate.toISOString().split('T')[0],
      hourlyData,
      summary: {
        totalClicks,
        peakHours,
        peakCount: maxCount,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('시간대별 통계 조회 에러:', error);
    return NextResponse.json(
      { 
        error: '시간대별 통계 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

