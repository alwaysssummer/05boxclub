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
        const sortedFiles = obj[key].sort((a: any, b: any) => 
          naturalSort(a.name, b.name)
        );
        result[key] = sortedFiles;
        
        // 디버깅: 정렬 전후 확인
        if (obj[key].some((f: any) => f.name.includes('한줄'))) {
          console.log(`[DEBUG removeEmptyFolders] 정렬 전:`, obj[key].map((f: any) => f.name));
          console.log(`[DEBUG removeEmptyFolders] 정렬 후:`, sortedFiles.map((f: any) => f.name));
        }
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
    // Supabase 기본 제한(1000개)을 우회하기 위해 모든 데이터 가져오기
    let allFiles: any[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: batchFiles, error: batchError } = await supabase
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
            display_order,
            categories (
              id,
              name,
              icon,
              display_order
            )
          )
        `)
        .eq('is_active', true)
        .order('name')
        .range(from, from + batchSize - 1);

      if (batchError) {
        console.error('[Files Tree] 파일 조회 실패:', batchError);
        return NextResponse.json(
          { success: false, error: batchError.message },
          { status: 500 }
        );
      }

      if (batchFiles && batchFiles.length > 0) {
        allFiles = allFiles.concat(batchFiles);
        from += batchSize;
        hasMore = batchFiles.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    const activeFiles = allFiles;
    const filesError = null;
    
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
      display_order: number;
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
          display_order: textbook.display_order ?? 999,
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
    
    // 4. 정렬 (카테고리별 display_order 우선, 같은 카테고리 내에서는 교재 display_order 순)
    textbooksWithStats.sort((a, b) => {
      // 카테고리가 없는 교재는 맨 뒤로
      if (!a.category_id && b.category_id) return 1;
      if (a.category_id && !b.category_id) return -1;
      
      // 카테고리가 다르면 카테고리 순서로 정렬
      const categoryOrderA = a.category?.display_order ?? 999;
      const categoryOrderB = b.category?.display_order ?? 999;
      if (categoryOrderA !== categoryOrderB) {
        return categoryOrderA - categoryOrderB;
      }
      
      // 같은 카테고리 내에서는 교재 display_order로 정렬
      const displayOrderA = a.display_order ?? 999;
      const displayOrderB = b.display_order ?? 999;
      if (displayOrderA !== displayOrderB) {
        return displayOrderA - displayOrderB;
      }
      
      // display_order도 같으면 이름순
      return a.name.localeCompare(b.name);
    });
    
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
      
      // 디버깅: 공영2_동아(이) 교재의 파일 확인
      if (textbook.name === '공영2_동아(이)') {
        console.log(`[DEBUG] 공영2_동아(이) 파일 수: ${files.length}`);
        const folder1Files = files.filter(f => f.dropbox_path?.includes('/1과/문장분석/'));
        console.log(`[DEBUG] 1과/문장분석 파일 수: ${folder1Files.length}`);
        console.log(`[DEBUG] 1과/문장분석 파일 목록:`, folder1Files.map(f => f.name));
      }
      
      // 파일을 경로별로 그룹화
      const filesByPath = files.reduce((acc, file) => {
        const path = file.dropbox_path || '';
        
        // 교재 경로를 기준으로 상대 경로 생성 (대소문자 무시)
        let relativePath = path;
        if (textbook.dropbox_path) {
          // 대소문자 무시하고 교재 경로로 시작하는지 확인
          if (path.toLowerCase().startsWith(textbook.dropbox_path.toLowerCase())) {
            relativePath = path.substring(textbook.dropbox_path.length);
          }
        }
        
        // 디버깅: 공영2_동아(이) 1과/문장분석 파일 처리
        if (textbook.name === '공영2_동아(이)' && path.includes('/1과/문장분석/')) {
          console.log(`[DEBUG] 파일 처리: ${file.name}`);
          console.log(`[DEBUG] - 원본 경로: ${path}`);
          console.log(`[DEBUG] - 상대 경로: ${relativePath}`);
        }
        
        // 상대 경로를 폴더 구조로 변환
        const relativeParts = relativePath.split('/').filter(Boolean);
        
        // 디버깅: relativeParts 확인
        if (textbook.name === '공영2_동아(이)' && path.includes('/1과/문장분석/')) {
          console.log(`[DEBUG] - relativeParts:`, relativeParts);
        }
        
        // 폴더 구조 생성 (마지막 요소는 파일명이므로 제외)
        let current = acc;
        for (let i = 0; i < relativeParts.length - 1; i++) {
          const folderName = relativeParts[i];
          
          if (!current[folderName]) {
            current[folderName] = {};
          }
          current = current[folderName];
        }
        
        // 마지막 레벨에 파일 추가
        if (!current._files) current._files = [];
        current._files.push(file);
        
        // 디버깅: 파일 추가 확인
        if (textbook.name === '공영2_동아(이)' && path.includes('/1과/문장분석/')) {
          console.log(`[DEBUG] - 파일 추가 완료: ${file.name}`);
        }
        
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

