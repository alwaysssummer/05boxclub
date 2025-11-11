import { getDropboxClient } from './client';
import { createApiClient } from '@/lib/supabase/server';
import { files } from 'dropbox';

/**
 * Supabase 클라이언트 헬퍼 (API Route용)
 */
function getSupabase() {
  return createApiClient();
}

/**
 * PDF 파일인지 확인
 */
export function isPdfFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.pdf');
}

/**
 * Dropbox 경로에서 교재명 추출
 * 예: /05boxAPP/--2025_EBS/Unit.11/파일.pdf -> --2025_EBS
 * DROPBOX_ROOT_PATH 이후의 첫 번째 폴더명을 교재명으로 사용
 */
export function extractTextbookName(path: string): string {
  const rootPath = process.env.DROPBOX_ROOT_PATH || '';
  
  // rootPath 제거
  let relativePath = path;
  if (rootPath && path.toLowerCase().startsWith(rootPath.toLowerCase())) {
    relativePath = path.substring(rootPath.length);
  }
  
  const parts = relativePath.split('/').filter(Boolean);
  return parts[0] || 'Unknown';
}

/**
 * 초기 전체 동기화
 * Dropbox의 모든 PDF 파일을 스캔하여 데이터베이스에 저장
 */
export async function fullSync(rootPath?: string): Promise<{
  success: boolean;
  filesAdded: number;
  filesUpdated: number;
  filesDeleted: number;
  errors: string[];
}> {
  const dbx = getDropboxClient();
  
  // rootPath가 제공되지 않으면 환경 변수에서 가져오기
  const syncPath = rootPath || process.env.DROPBOX_ROOT_PATH || '';
  
  const results = {
    success: true,
    filesAdded: 0,
    filesUpdated: 0,
    filesDeleted: 0,
    errors: [] as string[],
  };

  try {
    console.log(`[Full Sync] 시작: ${syncPath || '/'}`);
    
    // Dropbox에서 전체 파일 목록 가져오기
    let response = await dbx.filesListFolder({
      path: syncPath,
      recursive: true,
      include_deleted: false,
    });

    let allEntries = response.result.entries;

    // 페이지네이션 처리
    while (response.result.has_more) {
      response = await dbx.filesListFolderContinue({
        cursor: response.result.cursor,
      });
      allEntries = allEntries.concat(response.result.entries);
    }

    console.log(`[Full Sync] 총 ${allEntries.length}개 항목 발견`);

    // PDF 파일만 필터링
    const pdfFiles = allEntries.filter(
      (entry) => entry['.tag'] === 'file' && isPdfFile(entry.name)
    ) as files.FileMetadataReference[];

    console.log(`[Full Sync] PDF 파일 ${pdfFiles.length}개 필터링`);

    // 배치 단위로 파일 동기화 (100개씩)
    const BATCH_SIZE = 100;
    const supabase = getSupabase();
    
    for (let i = 0; i < pdfFiles.length; i += BATCH_SIZE) {
      const batch = pdfFiles.slice(i, i + BATCH_SIZE);
      console.log(`[Full Sync] 배치 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pdfFiles.length / BATCH_SIZE)} 처리 중 (${batch.length}개 파일)...`);
      
      try {
        // 1. 배치의 모든 교재명 추출
        const textbookNames = [...new Set(batch.map(file => extractTextbookName(file.path_display!)))];
        
        // 2. 교재 확인/생성
        const { data: existingTextbooks } = await supabase
          .from('textbooks')
          .select('id, name')
          .in('name', textbookNames);
        
        const existingTextbookMap = new Map(
          (existingTextbooks || []).map(t => [t.name, t.id])
        );
        
        // 3. 없는 교재는 생성
        const newTextbookNames = textbookNames.filter(name => !existingTextbookMap.has(name));
        if (newTextbookNames.length > 0) {
          const { data: newTextbooks, error: insertError} = await supabase
            .from('textbooks')
            .insert(newTextbookNames.map(name => ({ 
              name,
              dropbox_path: `${syncPath}/${name}` 
            })))
            .select('id, name');
          
          if (insertError) throw insertError;
          
          newTextbooks?.forEach(t => existingTextbookMap.set(t.name, t.id));
        }
        
        // 4. 파일 데이터 준비
        const fileRecords = batch.map(file => ({
          textbook_id: existingTextbookMap.get(extractTextbookName(file.path_display!)),
          name: file.name,
          file_type: 'pdf',
          dropbox_path: file.path_lower,
          dropbox_file_id: file.id,
          dropbox_rev: file.rev,
          file_size: file.size,
          last_modified: file.server_modified,
          is_active: true,
        }));
        
        // 5. 배치 Upsert (dropbox_path가 UNIQUE 제약 조건)
        const { error: upsertError } = await supabase
          .from('files')
          .upsert(fileRecords, {
            onConflict: 'dropbox_path',
          });
        
        if (upsertError) throw upsertError;
        
        results.filesAdded += batch.length;
        console.log(`[Full Sync] 배치 완료: 총 ${results.filesAdded}/${pdfFiles.length}개 처리됨`);
      } catch (error) {
        const errorMsg = `배치 동기화 실패 (${i}-${i + batch.length}): ${error instanceof Error ? error.message : JSON.stringify(error)}`;
        console.error(errorMsg, error);
        results.errors.push(errorMsg);
      }
    }

    // ==========================================
    // 삭제된 파일 처리
    // ==========================================
    console.log('[Full Sync] 삭제된 파일 확인 중...');
    
    // Dropbox에 존재하는 파일의 경로 목록
    const existingDropboxPaths = pdfFiles.map(f => f.path_lower);
    
    if (existingDropboxPaths.length > 0) {
      // DB에서 활성화된 파일 중 Dropbox에 없는 파일 비활성화
      const { data: deletedFiles, error: deleteError } = await supabase
        .from('files')
        .update({ is_active: false })
        .not('dropbox_path', 'in', `(${existingDropboxPaths.map(p => `"${p}"`).join(',')})`)
        .eq('is_active', true)
        .select('dropbox_path');
      
      if (deleteError) {
        console.error('[Full Sync] 삭제 처리 오류:', deleteError);
        results.errors.push(`삭제 처리 실패: ${deleteError.message}`);
      } else if (deletedFiles && deletedFiles.length > 0) {
        results.filesDeleted = deletedFiles.length;
        console.log(`[Full Sync] ${results.filesDeleted}개 파일 비활성화 완료`);
        deletedFiles.forEach(f => console.log(`  - ${f.dropbox_path}`));
      }
    } else {
      console.log('[Full Sync] Dropbox에 파일이 없음. 모든 파일 비활성화');
      // Dropbox에 파일이 하나도 없으면 모든 파일 비활성화
      const { data: deletedFiles, error: deleteError } = await supabase
        .from('files')
        .update({ is_active: false })
        .eq('is_active', true)
        .select('dropbox_path');
      
      if (deleteError) {
        console.error('[Full Sync] 전체 비활성화 오류:', deleteError);
        results.errors.push(`전체 비활성화 실패: ${deleteError.message}`);
      } else if (deletedFiles) {
        results.filesDeleted = deletedFiles.length;
        console.log(`[Full Sync] ${results.filesDeleted}개 파일 비활성화 완료`);
      }
    }

    // 동기화 커서 저장
    await saveSyncCursor(response.result.cursor);

    // 동기화 로그 기록
    await logSync('full', syncPath, 'success', {
      filesAdded: results.filesAdded,
      filesUpdated: results.filesUpdated,
      filesDeleted: results.filesDeleted,
    });

    console.log(`[Full Sync] 완료: ${results.filesAdded}개 추가, ${results.filesDeleted}개 삭제`);
  } catch (error) {
    results.success = false;
    const errorMsg = `전체 동기화 실패: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    console.error(errorMsg, error);
    results.errors.push(errorMsg);

    await logSync('full', syncPath, 'error', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  return results;
}

/**
 * 증분 동기화
 * 마지막 동기화 이후 변경된 파일만 처리
 */
export async function incrementalSync(): Promise<{
  success: boolean;
  changesProcessed: number;
  filesAdded: number;
  filesUpdated: number;
  filesDeleted: number;
  errors: string[];
}> {
  const dbx = getDropboxClient();
  const results = {
    success: true,
    changesProcessed: 0,
    filesAdded: 0,
    filesUpdated: 0,
    filesDeleted: 0,
    errors: [] as string[],
  };

  try {
    console.log('[Incremental Sync] 시작');

    // 저장된 커서 가져오기
    const cursor = await getSyncCursor();
    
    if (!cursor) {
      console.log('[Incremental Sync] 커서 없음. 전체 동기화 필요.');
      const fullSyncResult = await fullSync();
      return {
        success: fullSyncResult.success,
        changesProcessed: fullSyncResult.filesAdded + fullSyncResult.filesUpdated,
        filesAdded: fullSyncResult.filesAdded,
        filesUpdated: fullSyncResult.filesUpdated,
        filesDeleted: fullSyncResult.filesDeleted,
        errors: fullSyncResult.errors,
      };
    }

    // 변경사항 가져오기
    let response = await dbx.filesListFolderContinue({ cursor });
    let allChanges = response.result.entries;

    // 페이지네이션 처리
    while (response.result.has_more) {
      response = await dbx.filesListFolderContinue({
        cursor: response.result.cursor,
      });
      allChanges = allChanges.concat(response.result.entries);
    }

    console.log(`[Incremental Sync] ${allChanges.length}개 변경사항 발견`);

    // 변경사항 처리
    for (const entry of allChanges) {
      try {
        if (entry['.tag'] === 'file' && isPdfFile(entry.name)) {
          // PDF 파일 추가/수정
          const isNew = await syncFile(entry as files.FileMetadataReference);
          if (isNew) {
            results.filesAdded++;
          } else {
            results.filesUpdated++;
          }
          results.changesProcessed++;
        } else if (entry['.tag'] === 'deleted') {
          // 파일 삭제
          await deleteFile(entry.path_lower!);
          results.filesDeleted++;
          results.changesProcessed++;
        }
      } catch (error) {
        const errorMsg = `변경사항 처리 실패: ${entry.path_display || entry.path_lower} - ${error instanceof Error ? error.message : JSON.stringify(error)}`;
        console.error(errorMsg, error);
        results.errors.push(errorMsg);
      }
    }

    // 새 커서 저장
    await saveSyncCursor(response.result.cursor);

    // 동기화 로그 기록
    await logSync('incremental', '', 'success', {
      changesProcessed: results.changesProcessed,
      filesAdded: results.filesAdded,
      filesUpdated: results.filesUpdated,
      filesDeleted: results.filesDeleted,
    });

    console.log(`[Incremental Sync] 완료: ${results.changesProcessed}개 처리 (추가: ${results.filesAdded}, 수정: ${results.filesUpdated}, 삭제: ${results.filesDeleted})`);
  } catch (error) {
    results.success = false;
    const errorMsg = `증분 동기화 실패: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    console.error(errorMsg, error);
    results.errors.push(errorMsg);

    await logSync('incremental', '', 'error', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  return results;
}

/**
 * 개별 파일 동기화
 * @returns {boolean} 새로 추가된 파일이면 true, 기존 파일 업데이트면 false
 */
async function syncFile(file: files.FileMetadataReference): Promise<boolean> {
  const supabase = getSupabase();
  const textbookName = extractTextbookName(file.path_display!);

  // 1. 교재 확인/생성
  let { data: textbook } = await supabase
    .from('textbooks')
    .select('id')
    .eq('name', textbookName)
    .single();

  if (!textbook) {
    const { data: newTextbook, error } = await supabase
      .from('textbooks')
      .insert({ name: textbookName, description: '' })
      .select('id')
      .single();

    if (error) throw error;
    textbook = newTextbook;
  }

  // 2. 기존 파일 확인
  const { data: existingFile } = await supabase
    .from('files')
    .select('id')
    .eq('dropbox_path', file.path_lower)
    .single();

  const isNewFile = !existingFile;

  // 3. 파일 정보 저장/업데이트
  const { error } = await supabase
    .from('files')
    .upsert({
      textbook_id: textbook.id,
      file_name: file.name,
      file_path: file.path_display,
      dropbox_file_id: file.id,
      dropbox_rev: file.rev,
      dropbox_path: file.path_lower,
      file_size: file.size,
      last_modified: file.server_modified,
      is_active: true,
    }, {
      onConflict: 'dropbox_path',
    });

  if (error) throw error;

  console.log(`[Sync File] ${file.path_display} ${isNewFile ? '추가' : '업데이트'} 완료`);
  
  return isNewFile;
}

/**
 * 파일 삭제 처리
 */
async function deleteFile(pathLower: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('files')
    .update({ is_active: false })
    .eq('dropbox_path', pathLower);

  if (error) throw error;

  console.log(`[Delete File] ${pathLower} 비활성화 완료`);
}

/**
 * 동기화 커서 저장
 */
async function saveSyncCursor(cursor: string) {
  const supabase = getSupabase();
  
  // 기존 커서가 있는지 확인
  const { data: existing } = await supabase
    .from('dropbox_cursor')
    .select('id')
    .limit(1)
    .single();
  
  if (existing) {
    // 업데이트
    const { error } = await supabase
      .from('dropbox_cursor')
      .update({
        cursor_value: cursor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    
    if (error) throw error;
  } else {
    // 새로 생성
    const { error } = await supabase
      .from('dropbox_cursor')
      .insert({
        cursor_value: cursor,
        updated_at: new Date().toISOString(),
      });
    
    if (error) throw error;
  }
}

/**
 * 동기화 커서 가져오기
 */
async function getSyncCursor(): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('dropbox_cursor')
    .select('cursor_value')
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.cursor_value;
}

/**
 * 동기화 로그 기록
 */
async function logSync(
  syncType: 'full' | 'incremental' | 'webhook',
  dropboxPath: string,
  status: 'success' | 'error',
  metadata?: any
) {
  const supabase = getSupabase();
  await supabase.from('dropbox_sync_log').insert({
    sync_type: syncType,
    dropbox_path: dropboxPath,
    status,
    metadata,
  });
}

