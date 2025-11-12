'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useFile } from '@/contexts/FileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import RequestTextbookDialog from '@/components/RequestTextbookDialog';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Folder,
  Search,
  RefreshCw,
  Flame,
  Book,
  BookPlus
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  dropbox_path: string;
  click_count: number;
  file_size: number;
  last_modified: string;
}

interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  display_order: number;
}

interface TextbookItem {
  id: string;
  name: string;
  dropbox_path: string;
  category: CategoryInfo | null;
  totalClicks: number;
  fileCount: number;
  children: any;
}

export default function LeftSidebar() {
  const { selectFile } = useFile();
  const [textbooks, setTextbooks] = useState<TextbookItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all']));
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'clicks'>('name');
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  // 데이터 로드
  const loadData = async () => {
    try {
      const res = await fetch(`/api/files/tree?sort=${sortBy}`);
      const json = await res.json();
      
      if (json.success) {
        console.log('[LeftSidebar] 로드된 교재 수:', json.data.length);
        setTextbooks(json.data);
        setLastSync(new Date().toLocaleTimeString('ko-KR'));
        
        // 초기 로드 시 모든 카테고리를 닫힌 채로 시작
        setExpandedCategories(new Set<string>());
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  // Supabase Realtime 구독
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('files-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'files' },
        () => {
          console.log('[Realtime] 파일 변경 감지 - 새로고침');
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'textbooks' },
        () => {
          console.log('[Realtime] 교재 변경 감지 - 새로고침');
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          console.log('[Realtime] 카테고리 변경 감지 - 새로고침');
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  // 파일 클릭 처리 (클릭 추적 + 파일 선택)
  const handleFileClick = async (file: FileItem) => {
    // 1. 파일 선택 (PDF 뷰어에 표시)
    selectFile(file);

    // 2. 클릭 추적 (비동기, 백그라운드)
    try {
      await fetch('/api/track/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: file.id,
        }),
      });
      // 성공/실패 관계없이 UI에는 영향 없음 (로깅만)
    } catch (error) {
      console.error('클릭 추적 실패:', error);
      // 에러가 나도 파일 뷰어는 정상 작동
    }
  };

  // 폴더 토글
  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  // 카테고리 토글
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // 검색 필터
  const filteredTextbooks = textbooks.filter(tb => 
    tb.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 카테고리별로 교재 그룹화
  const groupedByCategory = filteredTextbooks.reduce((acc, textbook) => {
    const categoryId = textbook.category?.id || 'uncategorized';
    const categoryName = textbook.category?.name || '미분류';
    const categoryIcon = textbook.category?.icon || '📚';
    const displayOrder = textbook.category?.display_order || 999;
    
    if (!acc[categoryId]) {
      acc[categoryId] = {
        id: categoryId,
        name: categoryName,
        icon: categoryIcon,
        displayOrder,
        textbooks: [],
      };
    }
    
    acc[categoryId].textbooks.push(textbook);
    return acc;
  }, {} as Record<string, { id: string; name: string; icon: string; displayOrder: number; textbooks: TextbookItem[] }>);

  // 카테고리를 display_order 순으로 정렬
  const sortedCategories = Object.values(groupedByCategory).sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  // 폴더 트리 렌더링
  const renderFolder = (name: string, children: any, path: string, level: number = 0) => {
    const isExpanded = expandedFolders.has(path);
    const files = children._files || [];
    const subFolders = Object.keys(children).filter(key => key !== '_files');
    
    return (
      <div key={path} className="select-none">
        <div
          className="flex items-center gap-0.5 px-2 py-0.5 hover:bg-accent rounded cursor-pointer"
          style={{ paddingLeft: `${level * 10 + 8}px` }}
          onClick={() => toggleFolder(path)}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
          )}
          {/* level 1 (단원명)만 폴더 아이콘 표시 */}
          {level === 1 && <Folder className="w-3 h-3 flex-shrink-0 text-blue-500" />}
          <span className="text-xs truncate">{name}</span>
        </div>

        {isExpanded && (
          <div>
            {/* 하위 폴더 */}
            {subFolders.map(folderName => 
              renderFolder(folderName, children[folderName], `${path}/${folderName}`, level + 1)
            )}

            {/* 파일 목록 */}
            {files.map((file: FileItem) => (
              <div
                key={file.id}
                className="flex items-center gap-0.5 px-2 py-0.5 hover:bg-accent rounded cursor-pointer"
                style={{ paddingLeft: `${(level + 1) * 10 + 8}px` }}
                onClick={() => handleFileClick(file)}
              >
                <FileText className="w-3 h-3 flex-shrink-0 text-red-500" />
                <span className="text-xs truncate flex-1">{file.name}</span>
                {file.click_count > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {file.click_count}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 상단: 검색 및 정렬 */}
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="교재 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('name')}
            className="flex-1"
          >
            이름순
          </Button>
          <Button
            variant={sortBy === 'clicks' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('clicks')}
            className="flex-1"
          >
            클릭순
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 검색 결과 없을 때 요청 버튼 */}
      {searchQuery && filteredTextbooks.length === 0 && (
        <div className="p-4 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            &quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRequestDialogOpen(true)}
            className="gap-2"
          >
            <BookPlus className="w-4 h-4" />
            이 교재 요청하기
          </Button>
        </div>
      )}

      {/* 중앙: 카테고리별 교재 목록 */}
      <div className="flex-1 overflow-y-auto p-2">
        {sortedCategories.map((category) => (
          <div key={category.id} className="mb-2">
            {/* 카테고리 헤더 */}
            <div
              className="flex items-center gap-2 px-2 py-1.5 mb-1 bg-muted/50 hover:bg-muted rounded cursor-pointer border-b-2 border-primary/20"
              onClick={() => toggleCategory(category.id)}
            >
              {expandedCategories.has(category.id) ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0 text-primary" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0 text-primary" />
              )}
              <span className="flex-1 font-semibold text-sm text-primary">
                {category.name}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {category.textbooks.length}
              </Badge>
            </div>

            {/* 카테고리 내 교재 목록 */}
            {expandedCategories.has(category.id) && (
              <div className="ml-1">
                {category.textbooks.map((textbook) => (
          <div key={textbook.id} className="mb-1">
            <div
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-accent rounded cursor-pointer"
              onClick={() => toggleFolder(textbook.id)}
            >
              {expandedFolders.has(textbook.id) ? (
                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <Book className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600" />
              <span className="flex-1 truncate text-sm font-medium">{textbook.name}</span>
              
              {textbook.totalClicks > 0 && (
                <>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {textbook.totalClicks}
                  </Badge>
                  {sortBy === 'clicks' && textbook.totalClicks > 100 && (
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                  )}
                </>
              )}
            </div>

            {expandedFolders.has(textbook.id) && (
              <div className="mt-0.5">
                {(() => {
                  const folderNames = Object.keys(textbook.children).filter(key => key !== '_files');
                  // 중복 제거
                  const uniqueFolderNames = Array.from(new Set(folderNames));
                  
                  return uniqueFolderNames.map(folderName => 
                    renderFolder(
                      folderName,
                      textbook.children[folderName],
                      `${textbook.id}/${folderName}`,
                      1
                    )
                  );
                })()}
                
                {/* 루트 레벨 파일 */}
                {textbook.children._files?.map((file: FileItem) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-0.5 px-2 py-0.5 hover:bg-accent rounded cursor-pointer ml-5"
                    onClick={() => selectFile(file)}
                  >
                    <FileText className="w-3 h-3 flex-shrink-0 text-red-500" />
                    <span className="text-xs truncate flex-1">{file.name}</span>
                    {file.click_count > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">
                        {file.click_count}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 하단: 동기화 상태 */}
      <div className="p-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>마지막 동기화:</span>
          <span>{lastSync || '-'}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span>교재 {filteredTextbooks.length}개</span>
          <span className="text-green-600">✓ 동기화됨</span>
        </div>
      </div>

      {/* 교재 요청 다이얼로그 */}
      <RequestTextbookDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        initialTextbookName={searchQuery}
        onSuccess={() => {
          // 요청 성공 후 검색어 초기화
          setSearchQuery('');
        }}
      />
    </div>
  );
}

