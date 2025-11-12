import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 한글로만 이루어진 파일명 디버깅
 */
export async function GET() {
  try {
    const supabase = createApiClient();

    // 모든 활성 파일 가져오기
    const { data: files, error } = await supabase
      .from('files')
      .select('id, name, dropbox_path, is_active')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // 파일명 패턴 분석
    const analysis = {
      total: files?.length || 0,
      withEnglishOrNumber: [] as any[],
      pureKorean: [] as any[],
      withSpace: [] as any[],
      withoutSpace: [] as any[],
    };

    files?.forEach(file => {
      const nameWithoutExt = file.name.replace(/\.pdf$/i, '');
      
      // 영문 또는 숫자 포함
      if (/[A-Za-z0-9]/.test(nameWithoutExt)) {
        analysis.withEnglishOrNumber.push({
          name: file.name,
          path: file.dropbox_path
        });
      } else {
        // 순수 한글 + 특수문자만
        analysis.pureKorean.push({
          name: file.name,
          path: file.dropbox_path
        });
      }

      // 띄어쓰기 포함 여부
      if (/ /.test(nameWithoutExt)) {
        analysis.withSpace.push({
          name: file.name,
          path: file.dropbox_path
        });
      } else {
        analysis.withoutSpace.push({
          name: file.name,
          path: file.dropbox_path
        });
      }
    });

    return NextResponse.json({
      success: true,
      analysis: {
        total: analysis.total,
        withEnglishOrNumber: analysis.withEnglishOrNumber.length,
        pureKorean: analysis.pureKorean.length,
        withSpace: analysis.withSpace.length,
        withoutSpace: analysis.withoutSpace.length,
      },
      samples: {
        pureKorean: analysis.pureKorean.slice(0, 20),
        withoutSpace: analysis.withoutSpace.slice(0, 20),
      }
    });
  } catch (error) {
    console.error('Korean files debug error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

