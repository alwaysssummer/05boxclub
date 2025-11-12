'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Bell, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

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
  const [requests, setRequests] = useState<TextbookRequest[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [noticesLoading, setNoticesLoading] = useState(true);

  // 교재 요청 클릭 핸들러
  const handleRequestClick = async (textbookName: string) => {
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textbookName }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const remaining = data.remainingCount !== undefined ? data.remainingCount : '?';
        alert(`요청이 등록되었습니다!\n24시간 내 남은 추천 횟수: ${remaining}회`);
        loadRequests(); // 목록 새로고침
      } else if (response.status === 429) {
        alert(data.error || '24시간 내 최대 5회까지만 추천할 수 있습니다.');
      } else {
        alert('요청 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('요청 실패:', error);
      alert('요청 중 오류가 발생했습니다.');
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
    loadRequests();
    loadNotices();
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
              <div key={notice.id} className="space-y-1">
                <p className="font-semibold text-sm">{notice.title}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {notice.content}
                </p>
                <p className="text-[10px] text-muted-foreground">
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
                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent transition-colors"
              >
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-primary">
                    {index + 1}
                  </span>
                </div>
                <p className="flex-1 text-xs font-medium truncate min-w-0">
                  {request.textbook_name}
                </p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {request.request_count}
                </Badge>
                <button
                  onClick={() => handleRequestClick(request.textbook_name)}
                  className="flex-shrink-0 p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                  title="나도 요청"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

    </div>
  );
}


