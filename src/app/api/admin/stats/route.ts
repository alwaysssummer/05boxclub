import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * GET /api/admin/stats
 * 관리자 대시보드 통계 데이터 조회
 * 
 * Query Parameters:
 * - period: 'today' | 'week' | 'month' (기본값: 'today')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';

    // TODO: 관리자 권한 체크 (Phase 6에서 구현)
    
    const supabase = createApiClient();

    // 1. 총 방문자 수 (file_clicks 테이블의 고유 IP 수)
    const { data: visitorData, error: visitorError } = await supabase
      .from('file_clicks')
      .select('user_ip', { count: 'exact' });

    if (visitorError) {
      console.error('방문자 조회 실패:', visitorError);
    }

    // 고유 IP 수 계산
    const uniqueVisitors = visitorData 
      ? new Set(visitorData.map(v => v.user_ip)).size 
      : 0;

    // 2. 기간별 다운로드 수 (file_clicks 수) - 한국 시간대(KST, UTC+9) 기준
    const now = new Date();
    const KST_OFFSET = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
    const kstNow = new Date(now.getTime() + KST_OFFSET);
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(kstNow.getTime() - (7 * 24 * 60 * 60 * 1000));
        startDate.setUTCHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(kstNow);
        startDate.setUTCMonth(kstNow.getUTCMonth() - 1);
        startDate.setUTCHours(0, 0, 0, 0);
        break;
      case 'today':
      default:
        startDate = new Date(kstNow);
        startDate.setUTCHours(0, 0, 0, 0);
        break;
    }
    
    // KST 기준 시작 시간을 UTC로 변환
    const utcStartDate = new Date(startDate.getTime() - KST_OFFSET);

    const { count: downloadCount, error: downloadError } = await supabase
      .from('file_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('clicked_at', utcStartDate.toISOString());

    if (downloadError) {
      console.error('다운로드 조회 실패:', downloadError);
    }

    // 3. 전체 교재 수 (is_active 컬럼이 없으므로 제거)
    const { count: textbookCount, error: textbookError } = await supabase
      .from('textbooks')
      .select('*', { count: 'exact', head: true });

    if (textbookError) {
      console.error('교재 조회 실패:', textbookError);
    }

    // 4. 대기중인 교재 요청 수 (모든 요청)
    const { count: requestCount, error: requestError } = await supabase
      .from('textbook_requests')
      .select('*', { count: 'exact', head: true });

    if (requestError) {
      console.error('요청 조회 실패:', requestError);
    }

    // 5. 추가 통계 (선택사항) - 한국 시간대(KST) 기준
    // 오늘 클릭 수
    const todayStart = new Date(kstNow);
    todayStart.setUTCHours(0, 0, 0, 0);
    const utcTodayStart = new Date(todayStart.getTime() - KST_OFFSET);

    const { count: todayClicks, error: todayClicksError } = await supabase
      .from('file_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('clicked_at', utcTodayStart.toISOString());

    if (todayClicksError) {
      console.error('오늘 클릭 조회 실패:', todayClicksError);
    }

    // 이번 주 클릭 수
    const weekStart = new Date(kstNow.getTime() - (7 * 24 * 60 * 60 * 1000));
    weekStart.setUTCHours(0, 0, 0, 0);
    const utcWeekStart = new Date(weekStart.getTime() - KST_OFFSET);

    const { count: weekClicks, error: weekClicksError } = await supabase
      .from('file_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('clicked_at', utcWeekStart.toISOString());

    if (weekClicksError) {
      console.error('이번 주 클릭 조회 실패:', weekClicksError);
    }

    // 이번 달 클릭 수
    const monthStart = new Date(kstNow);
    monthStart.setUTCMonth(kstNow.getUTCMonth() - 1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const utcMonthStart = new Date(monthStart.getTime() - KST_OFFSET);

    const { count: monthClicks, error: monthClicksError } = await supabase
      .from('file_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('clicked_at', utcMonthStart.toISOString());

    if (monthClicksError) {
      console.error('이번 달 클릭 조회 실패:', monthClicksError);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalVisitors: uniqueVisitors || 0,
        todayDownloads: downloadCount || 0,
        activeTextbooks: textbookCount || 0,
        pendingRequests: requestCount || 0,
      },
      details: {
        period,
        todayClicks: todayClicks || 0,
        weekClicks: weekClicks || 0,
        monthClicks: monthClicks || 0,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('통계 조회 에러:', error);
    return NextResponse.json(
      { 
        error: '통계 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

