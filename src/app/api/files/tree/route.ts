import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

/**
 * 파일 트리 구조 조회 (교재별 클릭수 포함)
 * GET /api/files/tree
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort') || 'name'; // 'name' | 'clicks'
    
    const supabase = createClient();
    
    // 1. 모든 교재와 파일 정보 가져오기
    const { data: textbooks, error: textbooksError } = await supabase
      .from('textbooks')
      .select(`
        id,
        name,
        dropbox_path,
        click_count,
        files (
          id,
          name,
          dropbox_path,
          file_size,
          click_count,
          is_active,
          last_modified
        )
      `)
      .eq('files.is_active', true);
    
    if (textbooksError) throw textbooksError;
    
    // 2. 교재별 클릭수 집계 및 정렬
    const textbooksWithStats = (textbooks || []).map(textbook => {
      const files = textbook.files || [];
      const totalClicks = files.reduce((sum, file) => sum + (file.click_count || 0), 0);
      
      return {
        ...textbook,
        totalClicks,
        fileCount: files.length,
      };
    });
    
    // 3. 정렬
    if (sortBy === 'clicks') {
      textbooksWithStats.sort((a, b) => b.totalClicks - a.totalClicks);
    } else {
      textbooksWithStats.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // 3.5. 파일이 없는 교재 제외 (Dropbox에서 삭제된 폴더 필터링)
    const filteredTextbooks = textbooksWithStats.filter(
      textbook => textbook.fileCount > 0
    );
    
    // 4. 파일 트리 구조 생성
    const tree = filteredTextbooks.map(textbook => {
      const files = textbook.files || [];
      
      // 파일을 경로별로 그룹화
      const filesByPath = files.reduce((acc, file) => {
        const path = file.dropbox_path || '';
        const parts = path.split('/').filter(Boolean);
        
        // 경로 구조 생성 (교재 다음 폴더들)
        let current = acc;
        for (let i = 1; i < parts.length - 1; i++) {
          const folderName = parts[i];
          
          // 교재명과 동일한 폴더명이면 스킵 (중복 방지)
          if (folderName === textbook.name) {
            continue;
          }
          
          if (!current[folderName]) {
            current[folderName] = {};
          }
          current = current[folderName];
        }
        
        // 마지막 레벨에 파일 추가
        if (!current._files) current._files = [];
        current._files.push(file);
        
        return acc;
      }, {} as any);
      
      return {
        id: textbook.id,
        name: textbook.name,
        dropbox_path: textbook.dropbox_path,
        totalClicks: textbook.totalClicks,
        fileCount: textbook.fileCount,
        children: filesByPath,
      };
    });
    
    return NextResponse.json({
      success: true,
      data: tree,
      sortBy,
    });
  } catch (error) {
    console.error('[Files Tree] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

