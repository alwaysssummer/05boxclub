import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 특정 파일명 검색
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('name') || '';

    const supabase = createApiClient();

    // 파일명으로 검색 (대소문자 무시, 부분 일치)
    const { data: files, error } = await supabase
      .from('files')
      .select('id, name, dropbox_path, is_active, created_at, updated_at')
      .ilike('name', `%${filename}%`)
      .order('name');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      query: filename,
      found: files?.length || 0,
      files: files || [],
    });
  } catch (error) {
    console.error('Find missing files error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

