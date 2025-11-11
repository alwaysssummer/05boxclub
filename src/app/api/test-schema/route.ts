import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

/**
 * 테이블 스키마 확인
 * GET /api/test-schema
 */
export async function GET() {
  try {
    const supabase = createApiClient();
    
    // files 테이블에서 1개 행만 가져와서 컬럼 확인
    const { data: filesData, error: filesError } = await supabase
      .from('files')
      .select('*')
      .limit(1);
    
    // textbooks 테이블에서 1개 행만 가져와서 컬럼 확인
    const { data: textbooksData, error: textbooksError } = await supabase
      .from('textbooks')
      .select('*')
      .limit(1);
    
    return NextResponse.json({
      success: true,
      files: {
        columns: filesData && filesData.length > 0 ? Object.keys(filesData[0]) : [],
        sample: filesData,
        error: filesError?.message,
      },
      textbooks: {
        columns: textbooksData && textbooksData.length > 0 ? Object.keys(textbooksData[0]) : [],
        sample: textbooksData,
        error: textbooksError?.message,
      },
    });
  } catch (error) {
    console.error('[Test Schema] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


