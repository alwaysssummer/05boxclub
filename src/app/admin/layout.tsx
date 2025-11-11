'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  RefreshCw,
  BookOpen,
  MessageSquare,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { 
    icon: LayoutDashboard, 
    label: '대시보드', 
    href: '/admin',
    status: 'ready' 
  },
  { 
    icon: RefreshCw, 
    label: '동기화 관리', 
    href: '/admin/sync',
    status: 'ready',
    badge: '핵심'
  },
  { 
    icon: BookOpen, 
    label: '교재 관리', 
    href: '/admin/textbooks',
    status: 'pending'
  },
  { 
    icon: MessageSquare, 
    label: '요청 관리', 
    href: '/admin/requests',
    status: 'pending'
  },
  { 
    icon: Megaphone, 
    label: '공지사항', 
    href: '/admin/notices',
    status: 'pending'
  },
  { 
    icon: BarChart3, 
    label: '통계 분석', 
    href: '/admin/analytics',
    status: 'pending'
  },
  { 
    icon: Settings, 
    label: '설정', 
    href: '/admin/settings',
    status: 'pending'
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // 로그인 페이지는 인증 체크 스킵
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }

    // 세션 확인
    const isLoggedIn = sessionStorage.getItem('admin_authenticated') === 'true';
    
    if (!isLoggedIn) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, [pathname, router]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    router.push('/admin/login');
  };

  // 로그인 페이지는 레이아웃 없이 렌더링
  if (pathname === '/admin/login') {
    return children;
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 인증되지 않음
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs">
              A
            </div>
            <span className="hidden sm:inline">영어 자료실 관리자</span>
          </Link>

          <div className="flex-1" />

          {/* User Info & Logout */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">관리자</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-14 left-0 z-40
            h-[calc(100vh-3.5rem)]
            w-60 flex-shrink-0
            border-r bg-background
            transition-transform duration-200 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <nav className="flex flex-col gap-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isPending = item.status === 'pending';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                    transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isPending
                        ? 'text-muted-foreground hover:bg-muted'
                        : 'hover:bg-muted'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  
                  {item.badge && (
                    <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                  
                  {isPending && (
                    <span className="text-[10px] bg-muted-foreground/20 text-muted-foreground px-1.5 py-0.5 rounded">
                      준비중
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}


