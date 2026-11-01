'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, initials } from '@/lib/client';
import { UserCtx } from '@/components/User';
import { Icon, Loading } from '@/components/ui';
import { Brand } from '@/components/Logo';

export default function AppLayout({ children }) {
  const router = useRouter();
  const path = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => router.replace('/login'));
  }, [router]);

  useEffect(() => {
    if (user && !user.isAdmin && (path.startsWith('/team') || path.startsWith('/hishob'))) {
      router.replace('/dashboard');
    }
  }, [user, path, router]);

  if (!user) return <Loading />;

  const items = [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/camps', label: user.isAdmin ? 'Camps' : 'My camps', icon: 'map' },
    { href: '/leads', label: user.isAdmin ? 'All hotels' : 'Hotels', icon: 'list' },
    ...(user.isAdmin
      ? [
          { href: '/team', label: 'Team', icon: 'users', group: 'Manage' },
          { href: '/hishob', label: 'Hishob', icon: 'book' },
        ]
      : []),
    { href: '/settings', label: 'Settings', icon: 'settings', group: 'Account' },
  ];

  const active = (href) => path === href || path.startsWith(href + '/');

  return (
    <UserCtx.Provider value={user}>
      <div className="app">
        <aside className="sidebar">
          <div className="brand" style={{ padding: '4px 8px 16px' }}>
            <Brand size={36} />
          </div>
          <nav className="nav">
            {items.map((i) => (
              <div key={i.href} style={{ display: 'contents' }}>
                {i.group && <div className="nav-label">{i.group}</div>}
                <Link href={i.href} className={active(i.href) ? 'active' : ''}>
                  <Icon name={i.icon} /> {i.label}
                </Link>
              </div>
            ))}
          </nav>
          <Link href="/settings" className="sidebar-foot" title="Settings">
            <div className="avatar">{initials(user.name)}</div>
            <div className="who">
              <b>{user.name}</b>
              <span>{user.isAdmin ? 'Superadmin' : 'Team member'}</span>
            </div>
            <Icon name="settings" size={15} />
          </Link>
        </aside>

        <main className="main">
          <div className="topbar">
            <Brand size={32} />
            <div className="avatar">{initials(user.name)}</div>
          </div>
          {children}
        </main>

        <nav className="bottomnav">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className={active(i.href) ? 'active' : ''}>
              <Icon name={i.icon} size={19} />
              {i.label}
            </Link>
          ))}
        </nav>
      </div>
    </UserCtx.Provider>
  );
}
