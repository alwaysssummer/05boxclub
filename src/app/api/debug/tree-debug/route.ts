import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 파일 트리 디버깅 (공영2_동아(이) 전용)
 */
export async function GET() {
  try {
    const supabase = createApiClient();
    const logs: string[] = [];

    // 1. 공영2_동아(이) 교재 조회
    const { data: textbooks, error: textbooksError } = await supabase
      .from('textbooks')
      .select('id, name, dropbox_path, category_id')
      .eq('name', '공영2_동아(이)')
      .limit(1);

    if (textbooksError) throw textbooksError;
    if (!textbooks || textbooks.length === 0) {
      return NextResponse.json({ error: '교재를 찾을 수 없습니다.' }, { status: 404 });
    }

    const textbook = textbooks[0];
    logs.push(`교재 ID: ${textbook.id}`);
    logs.push(`교재 경로: ${textbook.dropbox_path}`);

    // 2. 해당 교재의 모든 활성 파일 조회
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, name, dropbox_path, is_active')
      .eq('textbook_id', textbook.id)
      .eq('is_active', true);

    if (filesError) throw filesError;

    logs.push(`전체 파일 수: ${files?.length || 0}`);

    // 3. 1과/문장분석 파일만 필터링
    const folder1Files = files?.filter(f => f.dropbox_path?.includes('/1과/문장분석/')) || [];
    logs.push(`1과/문장분석 파일 수: ${folder1Files.length}`);
    logs.push(`1과/문장분석 파일 목록: ${folder1Files.map(f => f.name).join(', ')}`);

    // 4. 파일 트리 생성 로직 시뮬레이션
    const filesByPath: any = {};
    const fileProcessing: any[] = [];

    folder1Files.forEach(file => {
      const path = file.dropbox_path || '';
      
      // 상대 경로 생성
      let relativePath = path;
      if (textbook.dropbox_path && path.toLowerCase().startsWith(textbook.dropbox_path.toLowerCase())) {
        relativePath = path.substring(textbook.dropbox_path.length);
      }
      
      const relativeParts = relativePath.split('/').filter(Boolean);
      
      fileProcessing.push({
        name: file.name,
        originalPath: path,
        relativePath: relativePath,
        relativeParts: relativeParts,
      });
      
      // 폴더 구조 생성
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

    // 5. 결과 확인
    const chapter1 = filesByPath['1과'];
    const analysisFolder = chapter1 ? chapter1['문장분석'] : null;
    const resultFiles = analysisFolder && analysisFolder._files ? analysisFolder._files.map((f: any) => f.name) : [];

    return NextResponse.json({
      success: true,
      logs: logs,
      fileProcessing: fileProcessing,
      fileTree: filesByPath,
      resultFiles: resultFiles,
      missingFiles: folder1Files.map(f => f.name).filter(name => !resultFiles.includes(name)),
    });
  } catch (error) {
    console.error('Tree debug error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

