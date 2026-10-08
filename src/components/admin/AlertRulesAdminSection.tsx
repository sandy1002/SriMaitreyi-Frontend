import { useEffect, useMemo, useState } from 'react';
import { Bell, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createAlertRule,
  deleteAlertRule,
  fetchAlertRuleCatalog,
  fetchAlertRules,
  updateAlertRule,
} from '@/services/api';
import type { AlertRule, AlertRuleCatalog } from '@/types';
import { useToast } from '@/hooks/use-toast';

const EMPTY_FORM = {
  name: '',
  description: '',
  domain: 'session',
  metricKey: '',
  operator: 'gt',
  thresholdValue: '',
  severity: 'medium',
  code: '',
  messageTemplate: 'Alert: {metric} is {value} (threshold {threshold}).',
  notifyRoles: ['admin', 'doctor'] as string[],
  isActive: true,
};

function severityClass(sev: string) {
  if (sev === 'critical' || sev === 'high') return 'bg-destructive/15 text-destructive';
  if (sev === 'medium') return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
  return 'bg-muted text-muted-foreground';
}

export function AlertRulesAdminSection() {
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<AlertRuleCatalog | null>(null);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AlertRule | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [domainFilter, setDomainFilter] = useState<string>('all');

  const metricsForDomain = useMemo(() => {
    if (!catalog) return [];
    return catalog.metrics.filter((m) => m.domain === form.domain);
  }, [catalog, form.domain]);

  const load = async () => {
    setLoading(true);
    try {
      const [cat, list] = await Promise.all([
        fetchAlertRuleCatalog(),
        fetchAlertRules(domainFilter === 'all' ? undefined : { domain: domainFilter }),
      ]);
      setCatalog(cat);
      setRules(list.rules);
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to load alert rules', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainFilter]);

  const openCreate = () => {
    setEditing(null);
    const defaultMetric = catalog?.metrics.find((m) => m.domain === 'session')?.key ?? '';
    setForm({ ...EMPTY_FORM, metricKey: defaultMetric });
    setDialogOpen(true);
  };

  const openEdit = (rule: AlertRule) => {
    setEditing(rule);
    setForm({
      name: rule.name,
      description: rule.description ?? '',
      domain: rule.domain,
      metricKey: rule.metricKey,
      operator: rule.operator,
      thresholdValue: rule.thresholdValue,
      severity: rule.severity,
      code: rule.code,
      messageTemplate: rule.messageTemplate,
      notifyRoles: [...(rule.notifyRoles ?? [])],
      isActive: rule.isActive,
    });
    setDialogOpen(true);
  };

  const toggleRole = (role: string, checked: boolean) => {
    setForm((prev) => {
      const set = new Set(prev.notifyRoles);
      if (checked) set.add(role);
      else set.delete(role);
      return { ...prev, notifyRoles: Array.from(set) };
    });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.metricKey || !form.thresholdValue.trim() || !form.code.trim()) {
      toast({ title: 'Name, metric, threshold, and code are required', variant: 'destructive' });
      return;
    }
    if (!form.notifyRoles.length) {
      toast({ title: 'Select at least one notify role', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        domain: form.domain,
        metricKey: form.metricKey,
        operator: form.operator,
        thresholdValue: form.thresholdValue.trim(),
        severity: form.severity,
        code: form.code.trim().toUpperCase().replace(/\s+/g, '_'),
        messageTemplate: form.messageTemplate.trim(),
        notifyRoles: form.notifyRoles,
        isActive: form.isActive,
      };
      if (editing) {
        await updateAlertRule(editing.id, payload);
        toast({ title: 'Rule updated' });
      } else {
        await createAlertRule(payload);
        toast({ title: 'Rule created' });
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      console.error(e);
      toast({
        title: editing ? 'Update failed' : 'Create failed',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule: AlertRule) => {
    try {
      await updateAlertRule(rule.id, { isActive: !rule.isActive });
      await load();
    } catch {
      toast({ title: 'Failed to toggle rule', variant: 'destructive' });
    }
  };

  const handleDelete = async (rule: AlertRule) => {
    if (!window.confirm(`Delete rule “${rule.name}”?`)) return;
    try {
      await deleteAlertRule(rule.id);
      toast({ title: 'Rule deleted' });
      await load();
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const metricLabel = (key: string) =>
    catalog?.metrics.find((m) => m.key === key)?.label ?? key;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            Alert rules
          </CardTitle>
          <CardDescription className="mt-1">
            Define generic metric thresholds. Matching session or nutrition events notify the
            selected roles.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              <SelectItem value="session">Session</SelectItem>
              <SelectItem value="nutrition">Nutrition</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New rule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && rules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading rules…</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No rules yet. Create one or wait for defaults to seed on backend startup.
          </p>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border p-3 bg-muted/20"
            >
              <div className="flex-1 min-w-[220px] space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm">{rule.name}</p>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {rule.domain}
                  </Badge>
                  <Badge className={severityClass(rule.severity)}>{rule.severity}</Badge>
                  {!rule.isActive && <Badge variant="secondary">inactive</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  <code className="text-[11px]">{rule.code}</code>
                  {' · '}
                  {metricLabel(rule.metricKey)} {rule.operator} {rule.thresholdValue}
                  {' · notify '}
                  {rule.notifyRoles.join(', ')}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">{rule.messageTemplate}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => handleToggleActive(rule)}
                    aria-label="Active"
                  />
                  <span className="text-xs text-muted-foreground hidden sm:inline">Active</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEdit(rule)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(rule)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit alert rule' : 'Create alert rule'}</DialogTitle>
            <DialogDescription>
              Use placeholders in the message: {'{value}'}, {'{threshold}'}, {'{metric}'}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="High pre-dialysis BP"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Domain *</Label>
                <Select
                  value={form.domain}
                  onValueChange={(v) => {
                    const nextMetric =
                      catalog?.metrics.find((m) => m.domain === v)?.key ?? '';
                    setForm((f) => ({ ...f, domain: v, metricKey: nextMetric }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(catalog?.domains ?? ['session', 'nutrition']).map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Severity *</Label>
                <Select
                  value={form.severity}
                  onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(catalog?.severities ?? ['low', 'medium', 'high', 'critical']).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Metric *</Label>
              <Select
                value={form.metricKey}
                onValueChange={(v) => setForm((f) => ({ ...f, metricKey: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {metricsForDomain.map((m) => (
                    <SelectItem key={m.key} value={m.key}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Operator *</Label>
                <Select
                  value={form.operator}
                  onValueChange={(v) => setForm((f) => ({ ...f, operator: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(catalog?.operators ?? ['gt', 'gte', 'lt', 'lte', 'eq']).map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Threshold *</Label>
                <Input
                  value={form.thresholdValue}
                  onChange={(e) => setForm((f) => ({ ...f, thresholdValue: e.target.value }))}
                  placeholder="180"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="RULE_BP_HIGH"
                disabled={!!editing}
              />
            </div>
            <div className="space-y-1">
              <Label>Message template *</Label>
              <Textarea
                rows={3}
                value={form.messageTemplate}
                onChange={(e) => setForm((f) => ({ ...f, messageTemplate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notify roles *</Label>
              <div className="flex flex-wrap gap-3">
                {(catalog?.roles ?? ['admin', 'technician', 'doctor', 'nutrition'])
                  .filter((r) => r !== 'patient')
                  .map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm capitalize">
                    <Checkbox
                      checked={form.notifyRoles.includes(role)}
                      onCheckedChange={(c) => toggleRole(role, c === true)}
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: c }))}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
