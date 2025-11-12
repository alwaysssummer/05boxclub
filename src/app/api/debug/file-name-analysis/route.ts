import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 파일명 상세 분석 (ver 6.0)
 */
export async function GET() {
  try {
    const supabase = createApiClient();

    // 1과/문장분석 폴더의 파일 조회
    const { data: files, error } = await supabase
      .from('files')
      .select('id, name, dropbox_path, is_active')
      .ilike('dropbox_path', '%공영2_동아(이)/1과/문장분석%')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // 파일명 상세 분석
    const analysis = files?.map(file => {
      const name = file.name;
      const nameWithoutExt = name.replace(/\.pdf$/i, '');
      
      const chars = name.split('');
      return {
        name: name,
        nameWithoutExt: nameWithoutExt,
        length: name.length,
        charCodes: chars.map(c => c.charCodeAt(0)),
        hasSpace: name.includes(' '),
        hasEnglish: /[A-Za-z]/.test(nameWithoutExt),
        hasNumber: /[0-9]/.test(nameWithoutExt),
        hasKoreanOnly: /^[가-힣\.]+$/.test(name),
        path: file.dropbox_path,
        pathLowerCase: file.dropbox_path.toLowerCase(),
      };
    });

    return NextResponse.json({
      success: true,
      count: files?.length || 0,
      files: analysis,
    });
  } catch (error) {
    console.error('File name analysis error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

