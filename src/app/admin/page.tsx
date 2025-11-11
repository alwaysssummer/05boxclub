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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalVisitors: 0,
    todayDownloads: 0,
    activeTextbooks: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');

  const loadStats = async () => {
    setLoading(true);
    try {
      // TODO: 실제 API 호출로 교체
      // 임시 데이터
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setStats({
        totalVisitors: 1234,
        todayDownloads: 56,
        activeTextbooks: 10,
        pendingRequests: 3,
      });
      
      setLastSync(new Date().toLocaleString('ko-KR'));
    } catch (error) {
      console.error('통계 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
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

      {/* Placeholder for Charts */}
      <Card>
        <CardHeader>
          <CardTitle>상세 통계 (준비 중)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>일별/주별/월별 통계 그래프가 여기 표시됩니다</p>
              <p className="text-sm mt-2">곧 추가 예정</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


