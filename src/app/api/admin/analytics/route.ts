import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * GET /api/admin/analytics
 * 관리자 분석 데이터 조회
 * 
 * Query Parameters:
 * - period: 'today' | 'week' | 'month' (기본값: 'month')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // TODO: 관리자 권한 체크 (Phase 6에서 구현)
    
    const supabase = createApiClient();

    // 기간 계산 - 한국 시간대(KST, UTC+9) 기준
    const now = new Date();
    const KST_OFFSET = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
    const kstNow = new Date(now.getTime() + KST_OFFSET);
    const startDate = new Date(kstNow);
    
    switch (period) {
      case 'today':
        startDate.setUTCHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setTime(kstNow.getTime() - (7 * 24 * 60 * 60 * 1000));
        startDate.setUTCHours(0, 0, 0, 0);
        break;
      case 'month':
      default:
        startDate.setTime(kstNow.getTime() - (30 * 24 * 60 * 60 * 1000));
        startDate.setUTCHours(0, 0, 0, 0);
        break;
    }
    
    // KST 기준 시작 시간을 UTC로 변환
    const utcStartDate = new Date(startDate.getTime() - KST_OFFSET);

    // 1. 시간대별 클릭 데이터 (0~23시, KST 기준)
    const { data: hourlyData } = await supabase
      .from('file_clicks')
      .select('clicked_at')
      .gte('clicked_at', utcStartDate.toISOString());

    // 시간대별 그룹화 (KST 기준)
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      count: 0,
    }));

    hourlyData?.forEach(click => {
      const utcDate = new Date(click.clicked_at);
      const kstDate = new Date(utcDate.getTime() + KST_OFFSET);
      const hour = kstDate.getUTCHours();
      hourlyStats[hour].count++;
    });

    // 2. 일별 클릭 데이터 (최근 30일, KST 기준)
    const dailyMap = new Map<string, number>();
    
    hourlyData?.forEach(click => {
      const utcDate = new Date(click.clicked_at);
      const kstDate = new Date(utcDate.getTime() + KST_OFFSET);
      const date = kstDate.toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 3. 인기 파일 TOP 20
    const { data: topFiles } = await supabase
      .from('files')
      .select(`
        id,
        name,
        click_count,
        chapters (
          name,
          textbooks (
            name
          )
        )
      `)
      .eq('is_active', true)
      .order('click_count', { ascending: false })
      .limit(20);

    const formattedTopFiles = topFiles?.map((file: any) => ({
      id: file.id,
      name: file.name,
      clickCount: file.click_count,
      chapterName: file.chapters?.name || '알 수 없음',
      textbookName: file.chapters?.textbooks?.name || '알 수 없음',
    })) || [];

    // 4. 요일별 통계 (월~일, KST 기준)
    const weekdayStats = Array.from({ length: 7 }, (_, i) => ({
      day: ['일', '월', '화', '수', '목', '금', '토'][i],
      count: 0,
    }));

    hourlyData?.forEach(click => {
      const utcDate = new Date(click.clicked_at);
      const kstDate = new Date(utcDate.getTime() + KST_OFFSET);
      const day = kstDate.getUTCDay();
      weekdayStats[day].count++;
    });

    // 5. 전체 통계
    const totalClicks = hourlyData?.length || 0;
    const avgDailyClicks = dailyStats.length > 0 
      ? Math.round(totalClicks / dailyStats.length)
      : 0;

    return NextResponse.json({
      success: true,
      period,
      stats: {
        totalClicks,
        avgDailyClicks,
        daysTracked: dailyStats.length,
      },
      hourlyStats,
      dailyStats,
      weekdayStats,
      topFiles: formattedTopFiles,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('분석 데이터 조회 에러:', error);
    console.error('에러 스택:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: '분석 데이터 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

