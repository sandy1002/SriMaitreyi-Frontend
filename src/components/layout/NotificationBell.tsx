import { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/api';
import type { AppNotification } from '@/types';

function severityBadge(sev: string) {
  if (sev === 'critical' || sev === 'high') return 'destructive' as const;
  return 'secondary' as const;
}

export function NotificationBell() {
  const { user, isAdmin, isStaff } = useAuth();
  const role = user?.role === 'admin' || isAdmin ? 'admin' : user?.role;
  const enabled = Boolean(role && (isAdmin || isStaff));

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !role) return;
    setLoading(true);
    try {
      const data = await fetchNotifications({ role, limit: 30 });
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [enabled, role]);

  useEffect(() => {
    if (!enabled) return;
    load();
    const id = window.setInterval(load, 45000);
    return () => window.clearInterval(id);
  }, [enabled, load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!enabled || !role) return null;

  const onOpenItem = async (n: AppNotification) => {
    if (n.status === 'unread') {
      try {
        await markNotificationRead(n.id, role);
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, status: 'read' } : x))
        );
        setUnread((c) => Math.max(0, c - 1));
      } catch {
        /* ignore */
      }
    }
  };

  const onMarkAll = async () => {
    try {
      await markAllNotificationsRead(role);
      setItems((prev) => prev.map((x) => ({ ...x, status: 'read' })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onMarkAll}
            disabled={unread === 0}
          >
            Mark all read
          </Button>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {loading && items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">Loading…</p>
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
          ) : (
            items.map((n) => {
              const body = (
                <div
                  className={`px-3 py-2.5 border-b last:border-0 hover:bg-muted/40 ${
                    n.status === 'unread' ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <Badge variant={severityBadge(n.severity)} className="shrink-0 text-[10px]">
                      {n.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {n.patientName ? `${n.patientName} · ` : ''}
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    {n.status === 'unread' ? ' · unread' : ''}
                  </p>
                </div>
              );
              if (n.linkPath) {
                return (
                  <Link
                    key={n.id}
                    to={n.linkPath}
                    onClick={() => {
                      onOpenItem(n);
                      setOpen(false);
                    }}
                  >
                    {body}
                  </Link>
                );
              }
              return (
                <button
                  key={n.id}
                  type="button"
                  className="w-full text-left"
                  onClick={() => onOpenItem(n)}
                >
                  {body}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
