import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
  try {
    const { textbooks: updatedTextbooks } = await request.json();
    
    if (!Array.isArray(updatedTextbooks) || updatedTextbooks.length === 0) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 데이터입니다.' },
        { status: 400 }
      );
    }

    const supabase = createApiClient();

    // 각 교재의 display_order 업데이트
    const updates = updatedTextbooks.map((textbook: { id: string; display_order: number }) =>
      supabase
        .from('textbooks')
        .update({ display_order: textbook.display_order })
        .eq('id', textbook.id)
    );

    const results = await Promise.all(updates);

    // 에러 확인
    for (const { error } of results) {
      if (error) {
        console.error('교재 순서 업데이트 실패:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
    }

    console.log(`[교재 순서 변경] ${updatedTextbooks.length}개 교재 순서 업데이트 완료`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('교재 순서 변경 API 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

