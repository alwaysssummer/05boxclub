import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

export async function PUT(request: Request) {
  try {
    const { categories } = await request.json();

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 요청입니다' },
        { status: 400 }
      );
    }

    const supabase = createApiClient();

    // 각 카테고리의 display_order를 업데이트
    for (const category of categories) {
      const { error } = await supabase
        .from('categories')
        .update({ display_order: category.display_order })
        .eq('id', category.id);

      if (error) {
        console.error('카테고리 순서 업데이트 실패:', error);
        return NextResponse.json(
          { success: false, error: '카테고리 순서 업데이트 실패' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: '카테고리 순서가 업데이트되었습니다',
    });
  } catch (error) {
    console.error('카테고리 순서 변경 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

