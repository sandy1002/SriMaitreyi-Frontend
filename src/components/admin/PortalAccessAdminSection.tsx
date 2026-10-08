import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  approvePortalAccessRequest,
  fetchPortalAccessRequests,
  rejectPortalAccessRequest,
  type PortalAccessRequest,
} from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export function PortalAccessAdminSection() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [items, setItems] = useState<PortalAccessRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPortalAccessRequests({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setItems(data.requests);
      setPendingCount(data.pendingCount);
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to load access requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const onApprove = async (row: PortalAccessRequest) => {
    setActingId(row.id);
    try {
      const res = await approvePortalAccessRequest(row.id);
      toast({ title: 'Approved', description: res.message });
      await load();
    } catch (e) {
      toast({
        title: 'Approve failed',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setActingId(null);
    }
  };

  const onReject = async (row: PortalAccessRequest) => {
    if (!window.confirm(`Reject access for ${row.fullName} (@${row.username})?`)) return;
    setActingId(row.id);
    try {
      await rejectPortalAccessRequest(row.id);
      toast({ title: 'Request rejected' });
      await load();
    } catch (e) {
      toast({
        title: 'Reject failed',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setActingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-5 w-5 text-primary" />
            Portal access approvals
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingCount} pending
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="mt-1">
            Review new Doctor Portal and Patient Portal signup requests. Approving creates their
            login account.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No requests in this filter.</p>
        ) : (
          items.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-start gap-3 rounded-lg border p-3 bg-muted/20"
            >
              <div className="flex-1 min-w-[220px] space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm">{row.fullName}</p>
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {row.portalType}
                  </Badge>
                  <Badge
                    variant={
                      row.status === 'pending'
                        ? 'destructive'
                        : row.status === 'approved'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="capitalize text-[10px]"
                  >
                    {row.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  @{row.username} · {row.email}
                  {row.phone ? ` · ${row.phone}` : ''}
                  {row.organization ? ` · ${row.organization}` : ''}
                  {row.specialty ? ` · ${row.specialty}` : ''}
                </p>
                {row.message && (
                  <p className="text-xs text-muted-foreground line-clamp-2">“{row.message}”</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Requested{' '}
                  {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                  {row.reviewedBy ? ` · reviewed by ${row.reviewedBy}` : ''}
                </p>
              </div>
              {row.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onApprove(row)}
                    disabled={actingId === row.id}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onReject(row)}
                    disabled={actingId === row.id}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
