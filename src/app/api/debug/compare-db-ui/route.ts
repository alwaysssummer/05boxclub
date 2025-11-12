import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 데이터베이스와 UI 파일 비교
 */
export async function GET() {
  try {
    const supabase = createApiClient();

    // 1. 공영2_동아(이) 1과/문장분석 폴더의 파일 조회 (DB)
    const { data: dbFiles, error } = await supabase
      .from('files')
      .select('id, name, dropbox_path, is_active, textbook_id')
      .ilike('dropbox_path', '%공영2_동아(이)/1과/문장분석%')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // 2. /api/files/tree 호출하여 UI 데이터 확인
    const treeResponse = await fetch('http://localhost:3000/api/files/tree');
    const treeData = await treeResponse.json();

    // 3. 공영2_동아(이) 교재 찾기
    const textbook = treeData.data?.find((t: any) => t.name === '공영2_동아(이)');
    
    let uiFiles: string[] = [];
    if (textbook && textbook.children) {
      // 1과 > 문장분석 폴더의 파일 목록 추출
      const chapter1 = textbook.children['1과'];
      if (chapter1) {
        const analysis = chapter1['문장분석'];
        if (analysis && analysis._files) {
          uiFiles = analysis._files.map((f: any) => f.name);
        }
      }
    }

    // 4. 비교
    const dbFileNames = dbFiles?.map(f => f.name) || [];
    const missingInUI = dbFileNames.filter(name => !uiFiles.includes(name));

    return NextResponse.json({
      success: true,
      database: {
        count: dbFiles?.length || 0,
        files: dbFileNames,
      },
      ui: {
        count: uiFiles.length,
        files: uiFiles,
      },
      missingInUI: missingInUI,
      analysis: {
        allFilesPresent: missingInUI.length === 0,
        issue: missingInUI.length > 0 ? '일부 파일이 UI에 표시되지 않음' : 'OK',
      },
    });
  } catch (error) {
    console.error('Compare DB UI error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

