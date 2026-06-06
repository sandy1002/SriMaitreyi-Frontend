import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Database,
  GitBranch,
  Network,
  Brain,
  ShieldAlert,
  FileStack,
} from 'lucide-react';
import {
  DATA_PLACEMENT,
  FUSEKI_ER,
  MULTI_STORE_FLOW,
  NEO4J_ER,
  POSTGRES_ER,
  STORE_ROLES,
} from '@/content/schemaArchitecture';

function DiagramBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 text-[11px] leading-relaxed font-mono whitespace-pre">
      {children.trim()}
    </pre>
  );
}

export default function ArchitecturePage() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-6xl space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">Schema &amp; architecture</h1>
              <Badge variant="secondary" className="gap-1">
                <ShieldAlert className="h-3 w-3" />
                Admin only
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Cross-store data design for engineering leads: what lives in PostgreSQL, the RDF
              knowledge graph (Fuseki), the property graph (Neo4j), vectors, and file storage.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to admin
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STORE_ROLES.map((s) => (
            <Card key={s.store} className={`border ${s.color}`}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">{s.store}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">{s.role}</CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GitBranch className="h-5 w-5 text-primary" />
              Multi-store request flow
            </CardTitle>
            <CardDescription>
              Every write lands in Postgres first; graphs and vectors are synced best-effort.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DiagramBlock>{MULTI_STORE_FLOW}</DiagramBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileStack className="h-5 w-5 text-primary" />
              What is stored where
            </CardTitle>
            <CardDescription>
              Use this table when explaining to stakeholders which system owns each clinical domain.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3 font-medium">Clinical domain</th>
                  <th className="py-2 pr-3 font-medium text-blue-700 dark:text-blue-300">PostgreSQL</th>
                  <th className="py-2 pr-3 font-medium text-violet-700 dark:text-violet-300">Fuseki KG</th>
                  <th className="py-2 pr-3 font-medium text-emerald-700 dark:text-emerald-300">Neo4j</th>
                  <th className="py-2 pr-3 font-medium text-amber-700 dark:text-amber-300">Chroma</th>
                  <th className="py-2 font-medium">Files</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {DATA_PLACEMENT.map((row) => (
                  <tr key={row.domain} className="border-b align-top">
                    <td className="py-2 pr-3 font-medium text-foreground">{row.domain}</td>
                    <td className="py-2 pr-3">{row.postgres}</td>
                    <td className="py-2 pr-3">{row.fuseki}</td>
                    <td className="py-2 pr-3">{row.neo4j}</td>
                    <td className="py-2 pr-3">{row.chroma}</td>
                    <td className="py-2">{row.files}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Tabs defaultValue="postgres" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="postgres" className="gap-1">
              <Database className="h-4 w-4" />
              PostgreSQL ER
            </TabsTrigger>
            <TabsTrigger value="fuseki" className="gap-1">
              <Network className="h-4 w-4" />
              Knowledge graph
            </TabsTrigger>
            <TabsTrigger value="neo4j" className="gap-1">
              <GitBranch className="h-4 w-4" />
              Property graph
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1">
              <Brain className="h-4 w-4" />
              AI &amp; vectors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="postgres" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>PostgreSQL entity-relationship diagram</CardTitle>
                <CardDescription>
                  Source of truth — ORM: <code>app/db/models.py</code> · DB: <code>dialysis</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DiagramBlock>{POSTGRES_ER}</DiagramBlock>
                <p className="text-sm text-muted-foreground">
                  Session lifecycle tables hold pre/post assessments, interval vitals, notes,
                  attachments metadata, in-session medications, and rule-generated alerts. Patient-level
                  diaries (nutrition, fluid, medication, vaccine) and investigations (CBP, lipid,
                  liver) feed medical reports and interdialytic calculations.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fuseki" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge graph (Apache Jena Fuseki)</CardTitle>
                <CardDescription>
                  RDF triples · dataset <code>dialysis_kg</code> · writer{' '}
                  <code>app/services/kg_service.py</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DiagramBlock>{FUSEKI_ER}</DiagramBlock>
                <p className="text-sm text-muted-foreground">
                  Best for ontology-aligned clinical concepts and SPARQL queries (e.g. sessions linked
                  to symptoms, CBP predicates). Lipid/liver panels and fluid diaries remain Postgres-only
                  today.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="neo4j" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Property graph (Neo4j)</CardTitle>
                <CardDescription>
                  Cypher paths · <code>app/graph/neo4j_service.py</code> · env{' '}
                  <code>NEO4J_ENABLED</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DiagramBlock>{NEO4J_ER}</DiagramBlock>
                <p className="text-sm text-muted-foreground">
                  Best for temporal chains (<code>FOLLOWED_BY</code>), recurring symptoms, and alert
                  patterns. Trends API merges Postgres weight series with Neo4j graph insights.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Chroma, LLM, and generated artifacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-foreground">Chroma</strong> — collection{' '}
                    <code>dialysis_notes</code>: embeddings of session notes and attachment text for{' '}
                    <code>/agent/clinical-summary</code>.
                  </li>
                  <li>
                    <strong className="text-foreground">OpenAI / LLM</strong> — session summaries on
                    close, report executive summary, clinical Q&amp;A (never primary vitals store).
                  </li>
                  <li>
                    <strong className="text-foreground">Medical PDF reports</strong> — built on
                    demand from Postgres; not persisted (Short / Detailed summary types).
                  </li>
                  <li>
                    <strong className="text-foreground">uploads/</strong> — session attachments and
                    health-history scans; Postgres stores <code>file_path</code> only.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Repository reference</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Full Mermaid ER diagrams, API map, K8s notes, and ops commands:{' '}
              <code>SriMaitreyi-app/ARCHITECTURE.md</code>
            </p>
            <p>
              This page is restricted to <strong className="text-foreground">Administrator</strong>{' '}
              login only (<code>/architecture</code> route + AdminRoute guard).
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
