import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// 카테고리 목록 조회
export async function GET() {
  try {
    const supabase = createApiClient();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      categories: categories || [],
    });
  } catch (error) {
    console.error('카테고리 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 조회 실패' },
      { status: 500 }
    );
  }
}

// 카테고리 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient();
    const body = await request.json();
    const { name, icon } = body;
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: '카테고리 이름이 필요합니다' },
        { status: 400 }
      );
    }
    
    // 현재 최대 display_order 조회
    const { data: maxOrder } = await supabase
      .from('categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    
    const newOrder = (maxOrder?.display_order || 0) + 1;
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name,
        icon: icon || '📚',
        display_order: newOrder,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('카테고리 생성 실패:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 생성 실패' },
      { status: 500 }
    );
  }
}

// 카테고리 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = createApiClient();
    const body = await request.json();
    const { id, name, icon, display_order } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '카테고리 ID가 필요합니다' },
        { status: 400 }
      );
    }
    
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (icon !== undefined) updates.icon = icon;
    if (display_order !== undefined) updates.display_order = display_order;
    
    const { data: category, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('카테고리 수정 실패:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 수정 실패' },
      { status: 500 }
    );
  }
}

// 카테고리 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createApiClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '카테고리 ID가 필요합니다' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('카테고리 삭제 실패:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 삭제 실패' },
      { status: 500 }
    );
  }
}

