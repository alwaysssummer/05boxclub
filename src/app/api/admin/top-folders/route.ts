import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/top-folders
 * 전체 교재의 폴더별 클릭 수 집계 - TOP 5
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const supabase = createApiClient();

    // 1. 모든 교재와 파일 조회
    const { data: textbooks, error: textbooksError } = await supabase
      .from('textbooks')
      .select('id, name, dropbox_path');

    if (textbooksError) {
      throw new Error(`교재 조회 실패: ${textbooksError.message}`);
    }

    // 2. 각 교재별로 폴더 통계 수집
    const allFolderStats: Array<{
      textbookId: string;
      textbookName: string;
      folderName: string;
      folderPath: string;
      totalClicks: number;
      fileCount: number;
    }> = [];

    for (const textbook of textbooks || []) {
      // 해당 교재의 활성 파일들 조회
      const { data: files } = await supabase
        .from('files')
        .select('id, name, dropbox_path, click_count')
        .eq('textbook_id', textbook.id)
        .eq('is_active', true);

      if (!files || files.length === 0) continue;

      // 폴더별로 그룹화
      const folderMap = new Map<string, {
        folderName: string;
        folderPath: string;
        files: any[];
        totalClicks: number;
        fileCount: number;
      }>();

      files.forEach(file => {
        const path = file.dropbox_path || '';
        const pathParts = path.split('/').filter(Boolean);
        
        // 교재 루트 경로 제거
        if (pathParts.length > 1 && textbook.dropbox_path) {
          const textbookPathParts = textbook.dropbox_path.split('/').filter(Boolean);
          pathParts.splice(0, textbookPathParts.length);
        }
        
        // 폴더명 추출
        let folderName = '루트';
        let folderPath = textbook.dropbox_path || '/';
        
        if (pathParts.length > 1) {
          folderName = pathParts[0];
          folderPath = `${textbook.dropbox_path}${folderName}/`;
        }
        
        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, {
            folderName,
            folderPath,
            files: [],
            totalClicks: 0,
            fileCount: 0,
          });
        }
        
        const stats = folderMap.get(folderName)!;
        stats.files.push(file);
        stats.totalClicks += file.click_count || 0;
        stats.fileCount++;
      });

      // 교재별 폴더 통계를 전체 목록에 추가
      folderMap.forEach((stats) => {
        allFolderStats.push({
          textbookId: textbook.id,
          textbookName: textbook.name,
          folderName: stats.folderName,
          folderPath: stats.folderPath,
          totalClicks: stats.totalClicks,
          fileCount: stats.fileCount,
        });
      });
    }

    // 3. 클릭 수 기준으로 정렬하고 TOP N 추출
    const topFolders = allFolderStats
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      folders: topFolders,
      count: topFolders.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('인기 폴더 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

