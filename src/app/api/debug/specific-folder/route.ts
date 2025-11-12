import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 특정 폴더의 파일 디버깅
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';

    const supabase = createApiClient();

    // 경로로 검색
    const { data: files, error } = await supabase
      .from('files')
      .select('id, name, dropbox_path, is_active, textbook_id, created_at')
      .ilike('dropbox_path', `%${path}%`)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      query: path,
      found: files?.length || 0,
      files: files || [],
    });
  } catch (error) {
    console.error('Specific folder debug error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

