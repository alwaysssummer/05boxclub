import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

/**
 * 데이터 초기화 (개발용)
 * DELETE /api/reset-data
 */
export async function DELETE() {
  try {
    const supabase = createApiClient();
    
    console.log('[Reset Data] 시작...');
    
    // 1. files 테이블 삭제
    const { error: filesError } = await supabase
      .from('files')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 행 삭제
    
    if (filesError) throw filesError;
    console.log('[Reset Data] files 테이블 삭제 완료');
    
    // 2. textbooks 테이블 삭제
    const { error: textbooksError } = await supabase
      .from('textbooks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 행 삭제
    
    if (textbooksError) throw textbooksError;
    console.log('[Reset Data] textbooks 테이블 삭제 완료');
    
    // 3. dropbox_cursor 테이블 삭제
    const { error: cursorError } = await supabase
      .from('dropbox_cursor')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 행 삭제
    
    if (cursorError) throw cursorError;
    console.log('[Reset Data] dropbox_cursor 테이블 삭제 완료');
    
    // 4. dropbox_sync_log 테이블 삭제 (선택사항)
    const { error: logError } = await supabase
      .from('dropbox_sync_log')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 행 삭제
    
    if (logError) throw logError;
    console.log('[Reset Data] dropbox_sync_log 테이블 삭제 완료');
    
    return NextResponse.json({
      success: true,
      message: '모든 데이터가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('[Reset Data] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


