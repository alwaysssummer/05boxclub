import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function AdminRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">요청 관리</h1>
        <p className="text-muted-foreground">
          사용자 교재 요청 처리
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>요청 관리 기능 (준비 중)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">요청 관리 페이지</h3>
              <p>교재 요청 목록, 상태 관리, 통계 기능이 추가될 예정입니다</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


