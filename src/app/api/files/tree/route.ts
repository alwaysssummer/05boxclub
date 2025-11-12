import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 파일/폴더 이름에서 숫자를 추출하여 정렬용 키 생성
 */
function extractSortKey(name: string): { number: number; text: string } {
  // unit 1, unit.1, unit_1, unit1 등 다양한 형태 지원
  const match = name.match(/(\d+)/);
  const number = match ? parseInt(match[1], 10) : 999999;
  return { number, text: name.toLowerCase() };
}

/**
 * 파일/폴더를 자연스러운 순서로 정렬
 */
function naturalSort(a: string, b: string): number {
  const aKey = extractSortKey(a);
  const bKey = extractSortKey(b);
  
  // 숫자가 다르면 숫자 순서로
  if (aKey.number !== bKey.number) {
    return aKey.number - bKey.number;
  }
  
  // 숫자가 같으면 텍스트 순서로
  return aKey.text.localeCompare(bKey.text);
}

/**
 * 빈 폴더 제거 및 정렬 (재귀적으로 파일이 없는 폴더 삭제, 파일/폴더 정렬)
 */
function removeEmptyFolders(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result: any = {};
  
  // 키를 정렬 (폴더명을 숫자 순서로)
  const sortedKeys = Object.keys(obj).sort((a, b) => {
    if (a === '_files') return 1; // _files는 항상 마지막
    if (b === '_files') return -1;
    return naturalSort(a, b);
  });
  
  for (const key of sortedKeys) {
    if (key === '_files') {
      // 파일 배열도 정렬
      if (obj[key] && obj[key].length > 0) {
        result[key] = obj[key].sort((a: any, b: any) => 
          naturalSort(a.name, b.name)
        );
      }
    } else {
      // 하위 폴더는 재귀적으로 정리 및 정렬
      const cleaned = removeEmptyFolders(obj[key]);
      
      // 하위에 파일이나 폴더가 있으면 유지
      if (cleaned && (cleaned._files?.length > 0 || Object.keys(cleaned).length > 0)) {
        result[key] = cleaned;
      }
      // 빈 폴더는 제거 (아무것도 추가하지 않음)
    }
  }
  
  return result;
}

/**
 * 트리 구조에 파일이 있는지 재귀적으로 확인
 */
function hasAnyFiles(obj: any): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  // _files 배열이 있고 비어있지 않으면 true
  if (obj._files && Array.isArray(obj._files) && obj._files.length > 0) {
    return true;
  }
  
  // 하위 폴더를 재귀적으로 확인
  for (const key in obj) {
    if (key !== '_files') {
      if (hasAnyFiles(obj[key])) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 파일 트리 구조 조회 (교재별 클릭수 포함)
 * GET /api/files/tree
 * 
 * 개선 사항:
 * - 활성화된 파일만 조회 (is_active = true)
 * - 파일이 없는 교재는 자동 제외
 * - 빈 폴더 자동 제거
 * - 직관적이고 안정적인 데이터 처리
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort') || 'name'; // 'name' | 'clicks'
    
    const supabase = createApiClient();
    
    console.log('[Files Tree] 교재 목록 조회 시작');
    
    // 1. 활성화된 파일만 조회 (Dropbox에 존재하는 파일)
    const { data: activeFiles, error: filesError } = await supabase
      .from('files')
      .select(`
        id,
        name,
        dropbox_path,
        file_size,
        click_count,
        last_modified,
        textbook_id,
        textbooks!inner (
          id,
          name,
          dropbox_path,
          category_id,
          categories (
            id,
            name,
            icon,
            display_order
          )
        )
      `)
      .eq('is_active', true)
      .order('name');
    
    if (filesError) {
      console.error('[Files Tree] 파일 조회 실패:', filesError);
      throw filesError;
    }
    
    console.log(`[Files Tree] 활성 파일 ${activeFiles?.length || 0}개 조회됨`);
    
    // 2. 교재별로 파일 그룹화 및 통계 계산
    const textbookMap = new Map<string, {
      id: string;
      name: string;
      dropbox_path: string;
      category_id: string | null;
      category: any;
      files: any[];
      totalClicks: number;
      fileCount: number;
    }>();
    
    (activeFiles || []).forEach((file: any) => {
      const textbook = file.textbooks;
      if (!textbook || typeof textbook !== 'object' || !textbook.id) {
        console.warn(`[Files Tree] 파일 ${file.name}의 교재 정보 없음`);
        return;
      }
      
      const textbookId = textbook.id;
      
      if (!textbookMap.has(textbookId)) {
        textbookMap.set(textbookId, {
          id: textbook.id,
          name: textbook.name,
          dropbox_path: textbook.dropbox_path,
          category_id: textbook.category_id || null,
          category: textbook.categories || null,
          files: [],
          totalClicks: 0,
          fileCount: 0,
        });
      }
      
      const textbookData = textbookMap.get(textbookId)!;
      textbookData.files.push({
        id: file.id,
        name: file.name,
        dropbox_path: file.dropbox_path,
        file_size: file.file_size,
        click_count: file.click_count,
        last_modified: file.last_modified,
      });
      textbookData.totalClicks += file.click_count || 0;
      textbookData.fileCount++;
    });
    
    console.log(`[Files Tree] ${textbookMap.size}개 교재 그룹화 완료`);
    
    // 3. Map을 배열로 변환
    let textbooksWithStats = Array.from(textbookMap.values());
    
    // 4. 정렬
    if (sortBy === 'clicks') {
      textbooksWithStats.sort((a, b) => b.totalClicks - a.totalClicks);
    } else {
      textbooksWithStats.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    console.log(`[Files Tree] 정렬 완료 (기준: ${sortBy})`);
    
    // 5. 파일 트리 구조 생성
    const tree = textbooksWithStats.map(textbook => {
      const files = textbook.files;
      const categoryInfo = textbook.category_id ? {
        id: textbook.category?.id || textbook.category_id,
        name: textbook.category?.name || '기타',
        icon: textbook.category?.icon || '📚',
        display_order: textbook.category?.display_order || 999,
      } : null;
      
      // 파일을 경로별로 그룹화
      const filesByPath = files.reduce((acc, file) => {
        const path = file.dropbox_path || '';
        const parts = path.split('/').filter(Boolean);
        
        // 경로 구조 생성 (DROPBOX_ROOT_PATH 이후부터 시작)
        const rootPath = process.env.DROPBOX_ROOT_PATH || '';
        let relativePath = path;
        if (rootPath && path.toLowerCase().startsWith(rootPath.toLowerCase())) {
          relativePath = path.substring(rootPath.length);
        }
        
        const relativeParts = relativePath.split('/').filter(Boolean);
        
        // 첫 번째 부분은 교재명이어야 함 (건너뛰기)
        let current = acc;
        for (let i = 1; i < relativeParts.length - 1; i++) {
          const folderName = relativeParts[i];
          
          // 교재명과 동일한 폴더명이면 스킵 (중복 방지, 대소문자 무시)
          if (folderName.toLowerCase() === textbook.name.toLowerCase()) {
            console.log(`[Files Tree] 중복 폴더 스킵: ${folderName} (교재: ${textbook.name})`);
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
        category: categoryInfo,
        totalClicks: textbook.totalClicks,
        fileCount: textbook.fileCount,
        children: filesByPath,
      };
    });
    
    // 6. 빈 폴더 제거 (파일이 없는 폴더는 표시하지 않음)
    const cleanTree = tree.map(textbook => ({
      ...textbook,
      children: removeEmptyFolders(textbook.children),
    }));
    
    // 7. 빈 교재 제거 (파일이 하나도 없는 교재는 표시하지 않음)
    const finalTree = cleanTree.filter(textbook => {
      const hasFiles = hasAnyFiles(textbook.children);
      if (!hasFiles) {
        console.log(`[Files Tree] 빈 교재 제거: ${textbook.name} (파일 없음)`);
      }
      return hasFiles;
    });
    
    console.log(`[Files Tree] 트리 구조 생성 완료, 최종 교재 수: ${finalTree.length}`);
    
    return NextResponse.json({
      success: true,
      data: finalTree,
      sortBy,
      stats: {
        totalTextbooks: finalTree.length,
        totalFiles: activeFiles?.length || 0,
      },
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

