import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// 교재를 특정 카테고리로 이동
export async function PUT(request: NextRequest) {
  try {
    const supabase = createApiClient();
    const body = await request.json();
    const { textbook_id, category_id } = body;
    
    if (!textbook_id) {
      return NextResponse.json(
        { success: false, error: '교재 ID가 필요합니다' },
        { status: 400 }
      );
    }
    
    console.log(`[교재 이동] textbook_id: ${textbook_id}, category_id: ${category_id || 'null'}`);
    
    const { data: textbook, error } = await supabase
      .from('textbooks')
      .update({ category_id: category_id || null })
      .eq('id', textbook_id)
      .select()
      .single();
    
    if (error) {
      console.error('[교재 이동] 실패:', error);
      throw error;
    }
    
    console.log('[교재 이동] 성공:', textbook);
    
    return NextResponse.json({
      success: true,
      textbook,
    });
  } catch (error) {
    console.error('교재 이동 실패:', error);
    return NextResponse.json(
      { success: false, error: '교재 이동 실패' },
      { status: 500 }
    );
  }
}

// 여러 교재를 일괄 이동
export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient();
    const body = await request.json();
    const { textbook_ids, category_id } = body;
    
    if (!textbook_ids || !Array.isArray(textbook_ids)) {
      return NextResponse.json(
        { success: false, error: '교재 ID 배열이 필요합니다' },
        { status: 400 }
      );
    }
    
    console.log(`[교재 일괄 이동] ${textbook_ids.length}개 교재 → category_id: ${category_id || 'null'}`);
    
    const { data: textbooks, error } = await supabase
      .from('textbooks')
      .update({ category_id: category_id || null })
      .in('id', textbook_ids)
      .select();
    
    if (error) {
      console.error('[교재 일괄 이동] 실패:', error);
      throw error;
    }
    
    console.log(`[교재 일괄 이동] 성공: ${textbooks?.length || 0}개 교재 이동`);
    
    return NextResponse.json({
      success: true,
      count: textbooks?.length || 0,
    });
  } catch (error) {
    console.error('교재 일괄 이동 실패:', error);
    return NextResponse.json(
      { success: false, error: '교재 일괄 이동 실패' },
      { status: 500 }
    );
  }
}

