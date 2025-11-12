import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

/**
 * POST /api/track/click
 * 파일 클릭 이벤트를 기록하고 클릭수를 증가시킵니다.
 * Updated: 2025-11-12 - Fixed Supabase client initialization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: '파일 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createApiClient();

    // 1. 파일 존재 여부 확인
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, name')
      .eq('id', fileId)
      .eq('is_active', true)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2. 사용자 IP 수집 (익명화)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // IP 마지막 옥텟 마스킹 (익명화)
    const anonymizedIp = ip.split('.').slice(0, 3).join('.') + '.xxx';

    // 3. 클릭 로그 저장
    const { error: clickError } = await supabase
      .from('file_clicks')
      .insert({
        file_id: fileId,
        user_ip: anonymizedIp,
      });

    if (clickError) {
      console.error('클릭 로그 저장 실패:', clickError);
      return NextResponse.json(
        { error: '클릭 로그 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 4. 파일 클릭수 증가 (트리거가 자동으로 처리)
    // increment_file_click_count 트리거가 자동으로 files.click_count를 증가시킴

    return NextResponse.json({
      success: true,
      message: '클릭이 기록되었습니다.',
      file: {
        id: file.id,
        name: file.name,
      },
    });

  } catch (error) {
    console.error('클릭 추적 에러:', error);
    return NextResponse.json(
      { 
        error: '클릭 추적 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/track/click
 * 최근 클릭 로그 조회 (테스트/디버깅용)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = createApiClient();

    const { data: clicks, error } = await supabase
      .from('file_clicks')
      .select(`
        id,
        clicked_at,
        user_ip,
        files:file_id (
          id,
          name,
          click_count
        )
      `)
      .order('clicked_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      clicks,
      count: clicks?.length || 0,
    });

  } catch (error) {
    console.error('클릭 로그 조회 에러:', error);
    return NextResponse.json(
      { error: '클릭 로그 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

