import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">설정</h1>
        <p className="text-muted-foreground">
          시스템 전반 설정 및 관리자 계정 관리
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>설정 기능 (준비 중)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Settings className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">설정 페이지</h3>
              <p>시스템 설정, Dropbox/Supabase 연동, 관리자 계정, 알림 설정 기능이 추가될 예정입니다</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


