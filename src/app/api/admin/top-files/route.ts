import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/top-files
 * 전체 교재의 파일별 클릭 수 집계 - TOP 10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = createApiClient();

    // 활성 파일들을 클릭 수 기준으로 조회
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select(`
        id,
        name,
        dropbox_path,
        click_count,
        is_active,
        textbook_id,
        textbooks!inner (
          id,
          name,
          dropbox_path
        )
      `)
      .eq('is_active', true)
      .order('click_count', { ascending: false })
      .limit(limit);

    if (filesError) {
      throw new Error(`파일 조회 실패: ${filesError.message}`);
    }

    // 파일 정보를 포맷팅 (폴더명 추출)
    const formattedFiles = (files || []).map(file => {
      const textbook = file.textbooks;
      let folderName = '루트';
      
      // 파일 경로에서 폴더 추출
      if (file.dropbox_path && textbook && typeof textbook === 'object') {
        const path = file.dropbox_path;
        const pathParts = path.split('/').filter(Boolean);
        
        // 교재 루트 경로 제거
        if (textbook.dropbox_path) {
          const textbookPathParts = textbook.dropbox_path.split('/').filter(Boolean);
          pathParts.splice(0, textbookPathParts.length);
        }
        
        // 폴더명 추출 (마지막은 파일명이므로 제외)
        if (pathParts.length > 1) {
          folderName = pathParts[0];
        }
      }

      return {
        id: file.id,
        fileName: file.name,
        textbookId: textbook?.id || '',
        textbookName: textbook?.name || '알 수 없음',
        folderName,
        dropboxPath: file.dropbox_path,
        clickCount: file.click_count || 0,
      };
    });

    return NextResponse.json({
      success: true,
      files: formattedFiles,
      count: formattedFiles.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('인기 파일 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

