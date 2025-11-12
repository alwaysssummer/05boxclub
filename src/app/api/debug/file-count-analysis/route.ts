import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 파일 개수 분석
 */
export async function GET() {
  try {
    const supabase = createApiClient();

    // 1. 전체 파일 개수 (is_active = true)
    const { count: activeCount, error: activeError } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (activeError) throw activeError;

    // 2. 전체 파일 개수 (is_active = false)
    const { count: inactiveCount, error: inactiveError } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false);

    if (inactiveError) throw inactiveError;

    // 3. 전체 파일 개수 (모두)
    const { count: totalCount, error: totalError } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // 4. /api/files/tree에서 반환되는 파일 개수
    const treeResponse = await fetch('http://localhost:3000/api/files/tree');
    const treeData = await treeResponse.json();
    
    let treeFileCount = 0;
    if (treeData.success && treeData.data) {
      treeData.data.forEach((textbook: any) => {
        treeFileCount += textbook.fileCount || 0;
      });
    }

    // 5. 교재별 파일 개수
    const { data: textbookCounts, error: textbookError } = await supabase
      .from('files')
      .select('textbook_id, textbooks(name), is_active')
      .eq('is_active', true);

    if (textbookError) throw textbookError;

    const textbookMap = new Map<string, { name: string; count: number }>();
    textbookCounts?.forEach((file: any) => {
      const textbookName = file.textbooks?.name || 'Unknown';
      if (!textbookMap.has(textbookName)) {
        textbookMap.set(textbookName, { name: textbookName, count: 0 });
      }
      const entry = textbookMap.get(textbookName)!;
      entry.count++;
    });

    const textbookSummary = Array.from(textbookMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      database: {
        active: activeCount,
        inactive: inactiveCount,
        total: totalCount,
      },
      api: {
        treeFileCount: treeFileCount,
      },
      discrepancy: {
        dbMinusTree: (activeCount || 0) - treeFileCount,
        message: (activeCount || 0) === treeFileCount 
          ? 'OK - DB와 Tree API 일치' 
          : `불일치: DB(${activeCount}) vs Tree(${treeFileCount})`,
      },
      topTextbooks: textbookSummary,
    });
  } catch (error) {
    console.error('File count analysis error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

