import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

export default function AdminNoticesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">공지사항</h1>
        <p className="text-muted-foreground">
          공지사항 생성, 수정, 삭제 관리
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>공지사항 관리 기능 (준비 중)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Megaphone className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">공지사항 관리 페이지</h3>
              <p>공지사항 CRUD, 활성화 관리, 우선순위 설정 기능이 추가될 예정입니다</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


