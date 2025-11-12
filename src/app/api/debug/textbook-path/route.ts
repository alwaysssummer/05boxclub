import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 교재 경로 확인
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || '';

    const supabase = createApiClient();

    const { data: textbooks, error } = await supabase
      .from('textbooks')
      .select('id, name, dropbox_path')
      .ilike('name', name);

    if (error) throw error;

    // 각 교재의 파일 경로도 샘플로 가져오기
    const results = await Promise.all(
      (textbooks || []).map(async (textbook) => {
        const { data: files } = await supabase
          .from('files')
          .select('dropbox_path')
          .eq('textbook_id', textbook.id)
          .eq('is_active', true)
          .limit(3);

        return {
          ...textbook,
          sampleFilePaths: files?.map(f => f.dropbox_path) || [],
        };
      })
    );

    return NextResponse.json({
      success: true,
      textbooks: results,
    });
  } catch (error) {
    console.error('Textbook path debug error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

