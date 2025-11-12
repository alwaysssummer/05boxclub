import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

// naturalSort 함수 복사
function extractSortKey(name: string): { number: number; text: string } {
  const match = name.match(/(\d+)/);
  const number = match ? parseInt(match[1], 10) : 999999;
  return { number, text: name.toLowerCase() };
}

function naturalSort(a: string, b: string): number {
  const aKey = extractSortKey(a);
  const bKey = extractSortKey(b);
  
  if (aKey.number !== bKey.number) {
    return aKey.number - bKey.number;
  }
  
  return aKey.text.localeCompare(bKey.text);
}

// removeEmptyFolders 함수 복사 (디버깅 추가)
function removeEmptyFolders(obj: any, path = ''): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result: any = {};
  
  const sortedKeys = Object.keys(obj).sort((a, b) => {
    if (a === '_files') return 1;
    if (b === '_files') return -1;
    return naturalSort(a, b);
  });
  
  for (const key of sortedKeys) {
    if (key === '_files') {
      if (obj[key] && obj[key].length > 0) {
        const sortedFiles = obj[key].sort((a: any, b: any) => 
          naturalSort(a.name, b.name)
        );
        result[key] = sortedFiles;
        
        console.log(`[DEBUG] ${path}/_files: ${sortedFiles.length}개`);
        console.log(`[DEBUG] 파일명:`, sortedFiles.map((f: any) => f.name));
      }
    } else {
      const cleaned = removeEmptyFolders(obj[key], `${path}/${key}`);
      
      if (cleaned && (cleaned._files?.length > 0 || Object.keys(cleaned).length > 0)) {
        result[key] = cleaned;
      }
    }
  }
  
  return result;
}

export async function GET() {
  try {
    const supabase = createApiClient();

    // 공영2_동아(이) 교재 조회
    const { data: textbooks } = await supabase
      .from('textbooks')
      .select('id, name, dropbox_path')
      .eq('name', '공영2_동아(이)')
      .single();

    if (!textbooks) {
      return NextResponse.json({ error: '교재 없음' }, { status: 404 });
    }

    const textbook = textbooks;

    // 해당 교재의 모든 활성 파일 조회
    const { data: files } = await supabase
      .from('files')
      .select('id, name, dropbox_path, is_active')
      .eq('textbook_id', textbook.id)
      .eq('is_active', true);

    console.log(`=== 공영2_동아(이) 파일 트리 처리 시작 ===`);
    console.log(`전체 파일 수: ${files?.length || 0}`);

    // 파일을 경로별로 그룹화
    const filesByPath: any = {};
    (files || []).forEach(file => {
      const path = file.dropbox_path || '';
      let relativePath = path;
      
      if (textbook.dropbox_path && path.toLowerCase().startsWith(textbook.dropbox_path.toLowerCase())) {
        relativePath = path.substring(textbook.dropbox_path.length);
      }
      
      const relativeParts = relativePath.split('/').filter(Boolean);
      
      if (path.includes('/1과/문장분석/')) {
        console.log(`\n파일: ${file.name}`);
        console.log(`  원본 경로: ${path}`);
        console.log(`  상대 경로: ${relativePath}`);
        console.log(`  경로 부분: [${relativeParts.join(', ')}]`);
      }
      
      let current = filesByPath;
      for (let i = 0; i < relativeParts.length - 1; i++) {
        const folderName = relativeParts[i];
        if (!current[folderName]) {
          current[folderName] = {};
        }
        current = current[folderName];
      }
      
      if (!current._files) current._files = [];
      current._files.push(file);
    });

    console.log(`\n=== removeEmptyFolders 적용 전 ===`);
    console.log(`1과/문장분석 파일:`, filesByPath['1과']?.['문장분석']?._files?.map((f: any) => f.name));

    // removeEmptyFolders 적용
    const cleanedTree = removeEmptyFolders(filesByPath);

    console.log(`\n=== removeEmptyFolders 적용 후 ===`);
    console.log(`1과/문장분석 파일:`, cleanedTree['1과']?.['문장분석']?._files?.map((f: any) => f.name));

    return NextResponse.json({
      success: true,
      before: filesByPath['1과']?.['문장분석']?._files?.map((f: any) => f.name) || [],
      after: cleanedTree['1과']?.['문장분석']?._files?.map((f: any) => f.name) || [],
    });
  } catch (error) {
    console.error('Tree full process error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

