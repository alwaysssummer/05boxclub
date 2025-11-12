import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * files와 textbooks 조인 확인
 */
export async function GET() {
  try {
    const supabase = createApiClient();

    // 1. 1과/문장분석 파일들의 textbook_id 확인
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, name, dropbox_path, textbook_id, is_active')
      .ilike('dropbox_path', '%공영2_동아(이)/1과/문장분석%')
      .eq('is_active', true);

    if (filesError) throw filesError;

    // 2. 각 파일의 textbook 정보 확인
    const fileDetails = await Promise.all(
      (files || []).map(async (file) => {
        const { data: textbook, error: textbookError } = await supabase
          .from('textbooks')
          .select('id, name, dropbox_path')
          .eq('id', file.textbook_id)
          .single();

        return {
          fileName: file.name,
          fileTextbookId: file.textbook_id,
          textbookExists: !textbookError,
          textbook: textbook,
          error: textbookError?.message,
        };
      })
    );

    // 3. textbooks!inner 조인 쿼리 (실제 API와 동일)
    const { data: joinedFiles, error: joinError } = await supabase
      .from('files')
      .select(`
        id,
        name,
        dropbox_path,
        textbook_id,
        textbooks!inner (
          id,
          name,
          dropbox_path
        )
      `)
      .ilike('dropbox_path', '%공영2_동아(이)/1과/문장분석%')
      .eq('is_active', true);

    if (joinError) throw joinError;

    return NextResponse.json({
      success: true,
      summary: {
        totalFiles: files?.length || 0,
        joinedFiles: joinedFiles?.length || 0,
        missingInJoin: (files?.length || 0) - (joinedFiles?.length || 0),
      },
      fileDetails: fileDetails,
      joinedFileNames: joinedFiles?.map(f => f.name) || [],
    });
  } catch (error) {
    console.error('Check join error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

