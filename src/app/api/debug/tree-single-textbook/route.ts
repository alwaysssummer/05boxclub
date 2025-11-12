import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 단일 교재의 파일 트리 디버깅
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const textbookName = searchParams.get('name') || '';

    const supabase = createApiClient();

    // 1. 교재 조회
    const { data: textbooks, error: textbooksError } = await supabase
      .from('textbooks')
      .select('id, name, dropbox_path')
      .ilike('name', textbookName)
      .limit(1);

    if (textbooksError) throw textbooksError;
    if (!textbooks || textbooks.length === 0) {
      return NextResponse.json({
        success: false,
        error: `교재를 찾을 수 없습니다: ${textbookName}`,
      }, { status: 404 });
    }

    const textbook = textbooks[0];

    // 2. 해당 교재의 모든 활성 파일 조회
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, name, dropbox_path, is_active, created_at')
      .eq('textbook_id', textbook.id)
      .eq('is_active', true)
      .order('dropbox_path');

    if (filesError) throw filesError;

    // 3. 파일을 경로별로 그룹화
    const filesByPath: any = {};
    files?.forEach(file => {
      const path = file.dropbox_path || '';
      const relativePath = path.replace(textbook.dropbox_path, '');
      const parts = relativePath.split('/').filter(Boolean);

      let current = filesByPath;
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        if (!current[folderName]) {
          current[folderName] = {};
        }
        current = current[folderName];
      }

      if (!current._files) current._files = [];
      current._files.push({
        id: file.id,
        name: file.name,
        path: file.dropbox_path,
      });
    });

    return NextResponse.json({
      success: true,
      textbook: {
        id: textbook.id,
        name: textbook.name,
        dropbox_path: textbook.dropbox_path,
      },
      totalFiles: files?.length || 0,
      fileTree: filesByPath,
    });
  } catch (error) {
    console.error('Tree single textbook debug error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

