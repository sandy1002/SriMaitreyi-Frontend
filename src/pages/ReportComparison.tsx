import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  Legend,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { usePatientDiaryPage } from '@/hooks/usePatientDiaryPage';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  fetchCbpReports,
  fetchNutritionDiaries,
  getPatientSessions,
} from '@/services/api';
import type { CbpReport, DialysisSession, NutritionDiaryEntry } from '@/types';
import {
  ArrowLeft,
  BarChart3,
  Droplets,
  HeartPulse,
  Loader2,
  Scale,
  TrendingUp,
  Utensils,
} from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '15', label: 'Last 15 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
] as const;

const nutritionChartConfig = {
  potassium: { label: 'Potassium (mg)', color: 'hsl(var(--chart-1))' },
  protein: { label: 'Protein (g)', color: 'hsl(var(--chart-2))' },
  kcal: { label: 'Kcal', color: 'hsl(var(--chart-3))' },
};

const bpChartConfig = {
  preSys: { label: 'Pre systolic', color: 'hsl(221 83% 53%)' },
  preDia: { label: 'Pre diastolic', color: 'hsl(221 83% 70%)' },
  postSys: { label: 'Post systolic', color: 'hsl(24 95% 53%)' },
  postDia: { label: 'Post diastolic', color: 'hsl(24 95% 70%)' },
};

const weightChartConfig = {
  pre: { label: 'Pre weight (kg)', color: 'hsl(var(--primary))' },
  post: { label: 'Post weight (kg)', color: 'hsl(var(--chart-2))' },
  target: { label: 'Target dry weight (kg)', color: 'hsl(var(--muted-foreground))' },
};

const ufChartConfig = {
  goal: { label: 'UF goal (L)', color: 'hsl(221 83% 53%)' },
  removed: { label: 'UF removed (L)', color: 'hsl(24 95% 53%)' },
};

const kChartConfig = {
  preK: { label: 'Pre K (mmol/L)', color: 'hsl(142 71% 35%)' },
  postK: { label: 'Post K (mmol/L)', color: 'hsl(142 71% 55%)' },
};

const ureaChartConfig = {
  preUrea: { label: 'Pre urea', color: 'hsl(221 83% 53%)' },
  postUrea: { label: 'Post urea', color: 'hsl(24 95% 53%)' },
};

const urrChartConfig = {
  urr: { label: 'URR %', color: 'hsl(262 83% 48%)' },
};

function parseBp(value?: string | null): { sys: number | null; dia: number | null } {
  if (!value) return { sys: null, dia: null };
  const m = String(value).match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return { sys: null, dia: null };
  return { sys: Number(m[1]), dia: Number(m[2]) };
}

function normalizeUfLiters(value?: number | null): number | null {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  if (n > 50) return Math.round((n / 1000) * 100) / 100;
  return n;
}

function withinDays(isoDate: string | undefined, days: number): boolean {
  if (!isoDate) return false;
  const d = new Date(isoDate.slice(0, 10) + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return false;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

function shortLabel(isoDate: string): string {
  return isoDate.slice(5, 10);
}

function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground justify-center">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground text-center py-10">{message}</p>;
}

export default function ReportComparison() {
  const {
    activePatient,
    targetPatientId,
    backPath,
    isAuthenticated,
    staffMissingRoute,
    staffPatientNotFound,
    patientMismatch,
    isTechnician,
  } = usePatientDiaryPage();
  const navigate = useNavigate();

  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diaries, setDiaries] = useState<NutritionDiaryEntry[]>([]);
  const [sessions, setSessions] = useState<DialysisSession[]>([]);
  const [cbpReports, setCbpReports] = useState<CbpReport[]>([]);

  const load = useCallback(async () => {
    if (!targetPatientId) return;
    setLoading(true);
    setError(null);
    try {
      const [nutrition, sess, cbp] = await Promise.all([
        fetchNutritionDiaries(targetPatientId),
        getPatientSessions(targetPatientId),
        fetchCbpReports(targetPatientId).catch(() => ({ reports: [] as CbpReport[] })),
      ]);
      setDiaries(nutrition);
      setSessions(sess);
      setCbpReports(cbp.reports ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  }, [targetPatientId]);

  useEffect(() => {
    load();
  }, [load]);

  const periodDays = Number(days) || 30;

  const nutritionData = useMemo(() => {
    return [...diaries]
      .filter((d) => withinDays(d.diaryDate, periodDays))
      .sort((a, b) => a.diaryDate.localeCompare(b.diaryDate))
      .map((d) => ({
        label: shortLabel(d.diaryDate),
        potassium: d.totalPotassiumMg ?? 0,
        protein: d.totalProteinG ?? 0,
        kcal: d.totalKcal ?? 0,
      }));
  }, [diaries, periodDays]);

  const sessionRows = useMemo(() => {
    return [...sessions]
      .filter((s) => withinDays(s.sessionDate, periodDays))
      .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
  }, [sessions, periodDays]);

  const bpData = useMemo(() => {
    return sessionRows
      .map((s) => {
        const pre = parseBp(s.preDialysisAssessment?.bloodPressure);
        const post = parseBp(s.postDialysisAssessment?.postBp);
        if (pre.sys == null && post.sys == null) return null;
        return {
          label: shortLabel(s.sessionDate),
          preSys: pre.sys ?? undefined,
          preDia: pre.dia ?? undefined,
          postSys: post.sys ?? undefined,
          postDia: post.dia ?? undefined,
        };
      })
      .filter(Boolean) as {
      label: string;
      preSys?: number;
      preDia?: number;
      postSys?: number;
      postDia?: number;
    }[];
  }, [sessionRows]);

  const weightData = useMemo(() => {
    return sessionRows
      .map((s) => {
        const pre = s.preDialysisAssessment?.weightKg;
        const post = s.postDialysisAssessment?.postWeightKg;
        if (pre == null && post == null) return null;
        return {
          label: shortLabel(s.sessionDate),
          pre: pre ?? undefined,
          post: post ?? undefined,
        };
      })
      .filter(Boolean) as { label: string; pre?: number; post?: number }[];
  }, [sessionRows]);

  const targetDryWeightKg = useMemo(() => {
    if (activePatient?.targetDryWeightKg != null) {
      return Number(activePatient.targetDryWeightKg);
    }
    for (const s of [...sessionRows].reverse()) {
      const dry = s.preDialysisAssessment?.targetDryWeightKg;
      if (dry != null) return Number(dry);
    }
    return null;
  }, [activePatient?.targetDryWeightKg, sessionRows]);

  const ufData = useMemo(() => {
    return sessionRows
      .map((s) => {
        const goal = normalizeUfLiters(s.preDialysisAssessment?.ufGoalLiters);
        const removed = normalizeUfLiters(s.postDialysisAssessment?.totalUfRemoved);
        if (goal == null && removed == null) return null;
        return {
          label: shortLabel(s.sessionDate),
          goal: goal ?? undefined,
          removed: removed ?? undefined,
        };
      })
      .filter(Boolean) as { label: string; goal?: number; removed?: number }[];
  }, [sessionRows]);

  const potassiumSessionData = useMemo(() => {
    return sessionRows
      .map((s) => {
        const preK = s.preDialysisAssessment?.potassiumMmolL;
        const postK = s.postDialysisAssessment?.postPotassiumMmolL;
        if (preK == null && (postK == null || postK <= 0)) return null;
        return {
          label: shortLabel(s.sessionDate),
          preK: preK ?? undefined,
          postK: postK && postK > 0 ? postK : undefined,
        };
      })
      .filter(Boolean) as { label: string; preK?: number; postK?: number }[];
  }, [sessionRows]);

  const ureaData = useMemo(() => {
    return [...cbpReports]
      .filter((r) => withinDays(r.report_date, periodDays))
      .filter((r) => r.pre_urea != null || r.post_urea != null)
      .sort((a, b) => a.report_date.localeCompare(b.report_date))
      .map((r) => ({
        label: shortLabel(r.report_date),
        preUrea: r.pre_urea ?? undefined,
        postUrea: r.post_urea ?? undefined,
      }));
  }, [cbpReports, periodDays]);

  const urrData = useMemo(() => {
    return [...cbpReports]
      .filter((r) => withinDays(r.report_date, periodDays))
      .filter((r) => r.urr_pct != null)
      .sort((a, b) => a.report_date.localeCompare(b.report_date))
      .map((r) => ({
        label: shortLabel(r.report_date),
        urr: r.urr_pct ?? undefined,
      }));
  }, [cbpReports, periodDays]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (staffMissingRoute) return <Navigate to="/staff" replace />;
  if (patientMismatch) return <Navigate to="/dashboard" replace />;
  if (!activePatient) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-12 text-center text-muted-foreground">
          {staffPatientNotFound ? 'Patient not found.' : 'Select a patient from the staff workspace.'}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate(backPath)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isTechnician ? 'Back to staff workspace' : 'Back to dashboard'}
          </Button>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-clinical border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Report comparison
              <span className="text-sm font-normal text-muted-foreground">— {activePatient.name}</span>
            </CardTitle>
            <CardDescription>
              Compare nutrition intake (Kcal, protein, potassium), pre/post blood pressure after
              dialysis sessions, weight, UF, and lab trends for the selected period.
            </CardDescription>
          </CardHeader>
        </Card>

        {loading && (
          <Card className="shadow-clinical">
            <CardContent className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading comparison charts…
            </CardContent>
          </Card>
        )}

        {error && !loading && (
          <Card className="shadow-clinical border-destructive/30">
            <CardContent className="py-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <Card className="shadow-clinical">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Utensils className="h-5 w-5 text-emerald-700" />
                  Nutrition comparison
                </CardTitle>
                <CardDescription>
                  Daily totals from the nutrition diary — potassium (mg), protein (g), and kcal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nutritionData.length > 0 ? (
                  <div className="space-y-3">
                    <ChartContainer config={nutritionChartConfig} className="h-[280px] w-full">
                      <BarChart data={nutritionData} margin={{ left: 4, right: 8, top: 28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis
                          yAxisId="left"
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                          width={42}
                          label={{ value: 'K mg / Protein g', angle: -90, position: 'insideLeft', offset: 8, fontSize: 10 }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                          width={42}
                          label={{ value: 'Kcal', angle: 90, position: 'insideRight', offset: 8, fontSize: 10 }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          yAxisId="left"
                          dataKey="potassium"
                          fill="var(--color-potassium)"
                          radius={[3, 3, 0, 0]}
                          name="Potassium (mg)"
                        >
                          <LabelList
                            dataKey="potassium"
                            position="top"
                            fontSize={9}
                            formatter={(v: number) => (v ? Math.round(v) : '')}
                          />
                        </Bar>
                        <Bar
                          yAxisId="left"
                          dataKey="protein"
                          fill="var(--color-protein)"
                          radius={[3, 3, 0, 0]}
                          name="Protein (g)"
                        >
                          <LabelList
                            dataKey="protein"
                            position="top"
                            fontSize={9}
                            formatter={(v: number) => (v ? Number(v).toFixed(1) : '')}
                          />
                        </Bar>
                        <Bar
                          yAxisId="right"
                          dataKey="kcal"
                          fill="var(--color-kcal)"
                          radius={[3, 3, 0, 0]}
                          name="Kcal"
                        >
                          <LabelList
                            dataKey="kcal"
                            position="top"
                            fontSize={9}
                            formatter={(v: number) => (v ? Math.round(v) : '')}
                          />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                    <ChartLegend
                      items={[
                        { color: 'hsl(var(--chart-1))', label: 'Potassium (mg) — left' },
                        { color: 'hsl(var(--chart-2))', label: 'Protein (g) — left' },
                        { color: 'hsl(var(--chart-3))', label: 'Kcal — right' },
                      ]}
                    />
                  </div>
                ) : (
                  <EmptyChart message="No nutrition diary entries in this period." />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-clinical">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HeartPulse className="h-5 w-5 text-rose-600" />
                  Pre &amp; post blood pressure
                </CardTitle>
                <CardDescription>
                  Session pre-dialysis BP vs post-dialysis BP (systolic and diastolic).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bpData.length > 0 ? (
                  <>
                    <ChartContainer config={bpChartConfig} className="h-[280px] w-full">
                      <LineChart data={bpData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} unit=" mmHg" width={52} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="preSys"
                          stroke="var(--color-preSys)"
                          strokeWidth={2}
                          dot
                          name="Pre systolic"
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="preDia"
                          stroke="var(--color-preDia)"
                          strokeWidth={2}
                          strokeDasharray="4 3"
                          dot
                          name="Pre diastolic"
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="postSys"
                          stroke="var(--color-postSys)"
                          strokeWidth={2}
                          dot
                          name="Post systolic"
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="postDia"
                          stroke="var(--color-postDia)"
                          strokeWidth={2}
                          strokeDasharray="4 3"
                          dot
                          name="Post diastolic"
                          connectNulls
                        />
                      </LineChart>
                    </ChartContainer>
                    <ChartLegend
                      items={[
                        { color: 'hsl(221 83% 53%)', label: 'Pre systolic' },
                        { color: 'hsl(221 83% 70%)', label: 'Pre diastolic' },
                        { color: 'hsl(24 95% 53%)', label: 'Post systolic' },
                        { color: 'hsl(24 95% 70%)', label: 'Post diastolic' },
                      ]}
                    />
                  </>
                ) : (
                  <EmptyChart message="No pre/post BP recorded on sessions in this period." />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-clinical">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Scale className="h-5 w-5 text-primary" />
                  Pre &amp; post weight
                </CardTitle>
                <CardDescription>
                  Session weight before and after dialysis (kg)
                  {targetDryWeightKg != null
                    ? ` · Target dry weight: ${targetDryWeightKg} kg`
                    : ''}
                  .
                </CardDescription>
              </CardHeader>
              <CardContent>
                {weightData.length > 0 ? (
                  <>
                    <ChartContainer config={weightChartConfig} className="h-[240px] w-full">
                      <LineChart data={weightData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} unit=" kg" width={48} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        {targetDryWeightKg != null ? (
                          <ReferenceLine
                            y={targetDryWeightKg}
                            stroke="hsl(var(--muted-foreground))"
                            strokeDasharray="4 4"
                            label={{
                              value: `Target ${targetDryWeightKg} kg`,
                              position: 'insideTopRight',
                              fontSize: 11,
                              fill: 'hsl(var(--muted-foreground))',
                            }}
                          />
                        ) : null}
                        <Line
                          type="monotone"
                          dataKey="pre"
                          stroke="var(--color-pre)"
                          strokeWidth={2}
                          dot
                          name="Pre weight"
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="post"
                          stroke="var(--color-post)"
                          strokeWidth={2}
                          dot
                          name="Post weight"
                          connectNulls
                        />
                      </LineChart>
                    </ChartContainer>
                    <ChartLegend
                      items={[
                        { color: 'hsl(var(--primary))', label: 'Pre weight' },
                        { color: 'hsl(var(--chart-2))', label: 'Post weight' },
                        ...(targetDryWeightKg != null
                          ? [
                              {
                                color: 'hsl(var(--muted-foreground))',
                                label: 'Target dry weight',
                              },
                            ]
                          : []),
                      ]}
                    />
                  </>
                ) : (
                  <EmptyChart message="No pre/post weights in this period." />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-clinical">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Droplets className="h-5 w-5 text-sky-600" />
                  UF goal vs removed
                </CardTitle>
                <CardDescription>Ultrafiltration goal compared with volume removed (liters).</CardDescription>
              </CardHeader>
              <CardContent>
                {ufData.length > 0 ? (
                  <>
                    <ChartContainer config={ufChartConfig} className="h-[240px] w-full">
                      <LineChart data={ufData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} unit=" L" width={42} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="goal"
                          stroke="var(--color-goal)"
                          strokeWidth={2}
                          dot
                          name="UF goal"
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="removed"
                          stroke="var(--color-removed)"
                          strokeWidth={2}
                          dot
                          name="UF removed"
                          connectNulls
                        />
                      </LineChart>
                    </ChartContainer>
                    <ChartLegend
                      items={[
                        { color: 'hsl(221 83% 53%)', label: 'UF goal (blue)' },
                        { color: 'hsl(24 95% 53%)', label: 'UF removed (orange)' },
                      ]}
                    />
                  </>
                ) : (
                  <EmptyChart message="No UF goal/removed values in this period." />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-clinical">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-700" />
                  Session potassium
                </CardTitle>
                <CardDescription>Pre-dialysis K and post-dialysis K when recorded (mmol/L).</CardDescription>
              </CardHeader>
              <CardContent>
                {potassiumSessionData.length > 0 ? (
                  <>
                    <ChartContainer config={kChartConfig} className="h-[240px] w-full">
                      <LineChart
                        data={potassiumSessionData}
                        margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} unit=" mmol/L" width={58} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="preK"
                          stroke="var(--color-preK)"
                          strokeWidth={2}
                          dot
                          name="Pre K"
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="postK"
                          stroke="var(--color-postK)"
                          strokeWidth={2}
                          dot
                          name="Post K"
                          connectNulls
                        />
                      </LineChart>
                    </ChartContainer>
                    <ChartLegend
                      items={[
                        { color: 'hsl(142 71% 35%)', label: 'Pre K' },
                        { color: 'hsl(142 71% 55%)', label: 'Post K' },
                      ]}
                    />
                  </>
                ) : (
                  <EmptyChart message="No session potassium values in this period." />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-clinical">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Urea trend (CBP)
                </CardTitle>
                <CardDescription>Pre and post urea from complete blood picture reports.</CardDescription>
              </CardHeader>
              <CardContent>
                {ureaData.length > 0 ? (
                  <>
                    <ChartContainer config={ureaChartConfig} className="h-[240px] w-full">
                      <LineChart data={ureaData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} width={42} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="preUrea"
                          stroke="var(--color-preUrea)"
                          strokeWidth={2}
                          dot
                          name="Pre urea"
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="postUrea"
                          stroke="var(--color-postUrea)"
                          strokeWidth={2}
                          dot
                          name="Post urea"
                          connectNulls
                        />
                      </LineChart>
                    </ChartContainer>
                    <ChartLegend
                      items={[
                        { color: 'hsl(221 83% 53%)', label: 'Pre urea (blue)' },
                        { color: 'hsl(24 95% 53%)', label: 'Post urea (orange)' },
                      ]}
                    />
                  </>
                ) : (
                  <EmptyChart message="No pre/post urea on CBP reports in this period." />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-clinical">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-violet-600" />
                  URR trend
                </CardTitle>
                <CardDescription>
                  Urea reduction ratio (%) from CBP. Typical HD adequacy target ≥ 65%.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {urrData.length > 0 ? (
                  <>
                    <ChartContainer config={urrChartConfig} className="h-[240px] w-full">
                      <LineChart data={urrData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} unit="%" width={42} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="urr"
                          stroke="var(--color-urr)"
                          strokeWidth={2}
                          dot
                          name="URR %"
                          connectNulls
                        />
                      </LineChart>
                    </ChartContainer>
                    <ChartLegend items={[{ color: 'hsl(262 83% 48%)', label: 'URR % (purple)' }]} />
                  </>
                ) : (
                  <EmptyChart message="No URR values in this period. Add pre/post urea on CBP reports." />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
