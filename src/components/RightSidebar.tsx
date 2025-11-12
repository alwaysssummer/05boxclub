'use client';

import { useState, useEffect } from 'react';
import { Clock, TrendingUp, Bell, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface RecentFile {
  id: string;
  clicked_at: string;
  files: {
    id: string;
    name: string;
    click_count: number;
  };
}

interface TextbookRequest {
  id: string;
  textbook_name: string;
  request_count: number;
  created_at: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

export default function RightSidebar() {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [requests, setRequests] = useState<TextbookRequest[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [noticesLoading, setNoticesLoading] = useState(true);

  // 최근 조회 자료 로드
  const loadRecentFiles = async () => {
    try {
      const supabase = createClient();
      
      if (!supabase) {
        console.error('Supabase 클라이언트 생성 실패');
        return;
      }
      
      const { data, error } = await supabase
        .from('file_clicks')
        .select(`
          id,
          clicked_at,
          files:file_id (
            id,
            name,
            click_count
          )
        `)
        .not('file_id', 'is', null)
        .order('clicked_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('최근 조회 로드 실패:', error);
        console.error('에러 상세:', JSON.stringify(error, null, 2));
        return;
      }

      // 중복 파일 제거 (같은 파일의 최신 클릭만 표시)
      const uniqueFiles: RecentFile[] = [];
      const seenFileIds = new Set<string>();

      for (const item of data || []) {
        const fileData = item.files as any;
        if (fileData && typeof fileData === 'object' && fileData.id && !seenFileIds.has(fileData.id)) {
          // files가 배열이 아닌 단일 객체로 변환
          const recentFile: RecentFile = {
            id: item.id,
            clicked_at: item.clicked_at,
            files: {
              id: fileData.id,
              name: fileData.name,
              click_count: fileData.click_count
            }
          };
          uniqueFiles.push(recentFile);
          seenFileIds.add(fileData.id);
        }
      }

      setRecentFiles(uniqueFiles.slice(0, 5)); // TOP 5만 표시
    } catch (error) {
      console.error('최근 조회 로드 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  // 교재 요청 목록 로드 (pending 상태만)
  const loadRequests = async () => {
    try {
      const response = await fetch('/api/admin/requests?status=pending&sort=request_count&order=desc');
      
      if (!response.ok) {
        console.error('요청 목록 API 에러:', response.status);
        setRequestsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        // TOP 5만 표시
        setRequests((data.requests || []).slice(0, 5));
      } else {
        console.error('요청 목록 로드 실패:', data.error);
      }
    } catch (error) {
      console.error('요청 목록 로드 에러:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  // 공지사항 로드
  const loadNotices = async () => {
    setNoticesLoading(true);
    try {
      const response = await fetch('/api/notices?limit=3');
      const data = await response.json();

      if (data.success && data.notices) {
        setNotices(data.notices);
      }
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
    } finally {
      setNoticesLoading(false);
    }
  };

  useEffect(() => {
    loadRecentFiles();
    loadRequests();
    loadNotices();
  }, []);

  // Realtime 구독 - file_clicks 테이블 변경 감지
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('file-clicks-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'file_clicks',
        },
        (payload) => {
          console.log('[Realtime] 새 클릭 감지:', payload);
          // 새 클릭 발생 시 목록 갱신
          loadRecentFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime 구독 - textbook_requests 테이블 변경 감지
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('textbook-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE
          schema: 'public',
          table: 'textbook_requests',
        },
        (payload) => {
          console.log('[Realtime] 교재 요청 변경 감지:', payload);
          // 요청 변경 시 목록 갱신
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime 구독 - notices 테이블 변경 감지
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('notices-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'notices',
        },
        (payload) => {
          console.log('[Realtime] 공지사항 변경 감지:', payload);
          // 공지사항 변경 시 목록 갱신
          loadNotices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 상대 시간 포맷
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      {/* 공지사항 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" />
            공지사항
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {noticesLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              로딩 중...
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              등록된 공지사항이 없습니다.
            </div>
          ) : (
            notices.map((notice) => (
              <div
                key={notice.id}
                className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200/50 dark:border-blue-800/50"
              >
                <p className="font-semibold mb-1">{notice.title}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {notice.content}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {formatTimeAgo(notice.created_at)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 교재 요청 순위 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            교재 요청 순위
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {requestsLoading ? (
            <div className="text-xs text-muted-foreground">
              로딩 중...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              요청된 교재가 없습니다.
            </div>
          ) : (
            requests.map((request, index) => (
              <div
                key={request.id}
                className="flex items-start gap-2 p-2 rounded hover:bg-accent transition-colors"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {request.textbook_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {request.request_count}명이 요청
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  {request.request_count}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 최근 조회 자료 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            최근 조회 자료
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="text-xs text-muted-foreground">
              로딩 중...
            </div>
          ) : recentFiles.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              아직 조회한 자료가 없습니다.
            </div>
          ) : (
            recentFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 p-2 rounded hover:bg-accent transition-colors"
              >
                <FileText className="w-3 h-3 mt-0.5 flex-shrink-0 text-red-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {item.files.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatTimeAgo(item.clicked_at)}
                  </p>
                </div>
                {item.files.click_count > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {item.files.click_count}
                  </Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}


