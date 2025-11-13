'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Download, 
  BookOpen, 
  MessageSquare,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Stats {
  totalVisitors: number;
  todayDownloads: number;
  activeTextbooks: number;
  pendingRequests: number;
}

interface TopTextbook {
  id: string;
  name: string;
  totalClicks: number;
  fileCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalVisitors: 0,
    todayDownloads: 0,
    activeTextbooks: 0,
    pendingRequests: 0,
  });
  const [topTextbooks, setTopTextbooks] = useState<TopTextbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [topTextbooksLoading, setTopTextbooksLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stats?period=today');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('통계 API 에러:', response.status, errorText);
        throw new Error(`API 에러: ${response.status}`);
      }

      const data = await response.json();
      console.log('통계 API 응답:', data);

      if (data.success && data.stats) {
        setStats({
          totalVisitors: data.stats.totalVisitors,
          todayDownloads: data.stats.todayDownloads,
          activeTextbooks: data.stats.activeTextbooks,
          pendingRequests: data.stats.pendingRequests,
        });
      } else {
        console.warn('예상치 못한 응답 형식:', data);
      }
      
      setLastSync(new Date().toLocaleString('ko-KR'));
    } catch (error) {
      console.error('통계 로딩 실패:', error);
      // 에러 발생 시 기본값 유지
      setLastSync('에러 발생');
    } finally {
      setLoading(false);
    }
  };

  const loadTopTextbooks = async () => {
    setTopTextbooksLoading(true);
    try {
      const response = await fetch('/api/admin/top-textbooks?limit=10');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 에러 응답:', response.status, errorText);
        throw new Error(`API 에러: ${response.status}`);
      }

      const data = await response.json();
      console.log('인기 교재 API 응답:', data);

      if (data.success && data.textbooks) {
        setTopTextbooks(data.textbooks);
      } else {
        console.warn('예상치 못한 응답 형식:', data);
        setTopTextbooks([]);
      }
    } catch (error) {
      console.error('인기 교재 로딩 실패:', error);
      setTopTextbooks([]); // 에러 시 빈 배열
    } finally {
      setTopTextbooksLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadTopTextbooks();
  }, []);

  const statCards = [
    {
      title: '총 방문자',
      value: stats.totalVisitors.toLocaleString(),
      icon: Users,
      description: '오늘 방문자 수',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: '오늘 다운로드',
      value: stats.todayDownloads.toLocaleString(),
      icon: Download,
      description: '오늘 다운로드된 파일',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: '활성 교재',
      value: stats.activeTextbooks.toLocaleString(),
      icon: BookOpen,
      description: '현재 제공 중인 교재',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: '대기중인 요청',
      value: stats.pendingRequests.toLocaleString(),
      icon: MessageSquare,
      description: '처리 대기 중',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">
            영어 자료실 전체 현황을 한눈에 확인하세요
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStats}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                  ) : (
                    card.value
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">빠른 실행</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => window.location.href = '/admin/sync'}
            >
              <RefreshCw className="h-4 w-4" />
              Dropbox 동기화 실행
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => window.location.href = '/admin/notices'}
            >
              <TrendingUp className="h-4 w-4" />
              공지사항 작성
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">시스템 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dropbox 연결</span>
              <span className="text-sm font-medium text-green-600">● 정상</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">데이터베이스</span>
              <span className="text-sm font-medium text-green-600">● 정상</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">마지막 동기화</span>
              <span className="text-sm font-medium">{lastSync || '확인 중...'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Textbooks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            인기 교재 TOP 10
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topTextbooksLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : topTextbooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              아직 클릭 데이터가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {topTextbooks.map((textbook, index) => (
                <div
                  key={textbook.id}
                  onClick={() => window.location.href = `/admin/textbooks/${textbook.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm flex-shrink-0
                      ${index === 0 ? 'bg-yellow-500 text-white' : ''}
                      ${index === 1 ? 'bg-gray-400 text-white' : ''}
                      ${index === 2 ? 'bg-orange-600 text-white' : ''}
                      ${index > 2 ? 'bg-muted text-muted-foreground' : ''}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{textbook.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {textbook.fileCount}개 파일
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {textbook.totalClicks.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">클릭</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for Charts */}
      <Card>
        <CardHeader>
          <CardTitle>시간대별 접속 통계 (준비 중)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>24시간 접속 그래프가 여기 표시됩니다</p>
              <p className="text-sm mt-2">곧 추가 예정</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


