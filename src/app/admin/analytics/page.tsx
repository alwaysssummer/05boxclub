import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">통계 분석</h1>
        <p className="text-muted-foreground">
          상세한 사용자 행동 분석 및 리포트
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>통계 분석 기능 (준비 중)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">통계 분석 페이지</h3>
              <p>방문 통계, 다운로드 분석, 사용자 행동 패턴, 성능 모니터링 기능이 추가될 예정입니다</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


