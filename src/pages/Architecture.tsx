import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Database, GitBranch, Network, Brain, Activity } from 'lucide-react';

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
      <code>{children.trim()}</code>
    </pre>
  );
}

export default function ArchitecturePage() {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-4xl space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Architecture</h1>
            <p className="text-muted-foreground mt-1">
              Admin reference — data flow, stores, APIs, and ops queries (May 2026)
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={isAdmin ? '/admin' : '/login'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isAdmin ? 'Back to admin' : 'Back to login'}
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Implementation status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            <Badge>Phase 1 — sessions, alerts, AI</Badge>
            <Badge variant="secondary">Phase 2 — Neo4j, trends, Chroma PDF</Badge>
            <Badge variant="outline">In-session vitals (BP, Pre K)</Badge>
            <Badge variant="outline">Admin console</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              End-to-end session flow
            </CardTitle>
            <CardDescription>Start → during (interval vitals) → close</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border p-4 font-mono text-xs leading-6 bg-muted/40">
{`Patient UI (React)
    │
    ├─ POST /sessions/start        → Postgres pre_assessment (+ optional Pre K)
    │                              → Fuseki KG, Neo4j Patient/Session, alerts
    │
    ├─ POST /sessions/{id}/vitals  → session_vital_readings (BP, pulse, K+)
    │                              → every 30/60 min while in-progress
    │                              → alerts: K_HIGH, BP_*_INTERVAL
    │
    ├─ POST /sessions/{id}/note    → Postgres, Fuseki, Chroma, Neo4j symptoms
    │
    ├─ POST /sessions/{id}/attachment → disk + PDF/text → Chroma
    │
    ├─ POST /sessions/{id}/end     → post_assessment, summary, Neo4j
    │
    ├─ GET  /patients/{id}/trends  → weight chart + Neo4j recurring symptoms
    │
    └─ POST /agent/clinical-summary → Fuseki + Postgres + Chroma + Neo4j + OpenAI`}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Pre-dialysis</Badge>
              <Badge variant="secondary">Interval vitals</Badge>
              <Badge>Notes & files</Badge>
              <Badge>Post-dialysis</Badge>
              <Badge variant="outline">AI & alerts</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              During-session vitals workflow
            </CardTitle>
            <CardDescription>Clinical log: BP, pulse, potassium (Pre K) on a schedule</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              While <code>status = in-progress</code>, clinicians log vitals at interval slots (default
              30 min). Data lives in <code>session_vital_readings</code> and drives interval alerts.
            </p>
            <CodeBlock>{`GET  /sessions/{id}/vitals/workflow?interval_minutes=30
POST /sessions/{id}/vitals
  { blood_pressure, pulse, potassium_mmol_l, uf_removed_liters, notes }

GET  /sessions/{id}  → includes vital_readings + vitals_workflow`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Where data is stored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Data</th>
                    <th className="py-2 pr-4">Primary store</th>
                    <th className="py-2">Also copied to</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b"><td className="py-2">Patients, session metadata</td><td>PostgreSQL</td><td>Neo4j Patient node</td></tr>
                  <tr className="border-b"><td className="py-2">Pre/post vitals</td><td>PostgreSQL</td><td>Fuseki RDF properties</td></tr>
                  <tr className="border-b"><td className="py-2">Interval BP / Pre K during session</td><td>PostgreSQL <code>session_vital_readings</code></td><td>Alerts table</td></tr>
                  <tr className="border-b"><td className="py-2">Note full text</td><td>PostgreSQL</td><td>Chroma, Fuseki symptoms</td></tr>
                  <tr className="border-b"><td className="py-2">Attachments</td><td>Disk <code>uploads/</code></td><td>Chroma (PDF/text)</td></tr>
                  <tr className="border-b"><td className="py-2">Clinical alerts</td><td>PostgreSQL</td><td>Neo4j Alert nodes</td></tr>
                  <tr className="border-b"><td className="py-2">Session chains / symptoms</td><td>Neo4j</td><td>—</td></tr>
                  <tr><td className="py-2">Session summary</td><td>PostgreSQL</td><td>OpenAI on close</td></tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Accordion type="multiple" className="w-full" defaultValue={['postgres', 'neo4j', 'api']}>
          <AccordionItem value="postgres">
            <AccordionTrigger>PostgreSQL schema</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>Database: <strong className="text-foreground">dialysis</strong></p>
              <CodeBlock>{`session_pre_assessments
  … weight_kg, blood_pressure, pulse, potassium_mmol_l (Pre K at start)

session_vital_readings
  id, session_id, interval_minutes, label,
  blood_pressure, pulse, potassium_mmol_l,
  uf_removed_liters, notes, recorded_at

session_post_assessments, session_notes, session_attachments, clinical_alerts`}</CodeBlock>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="kg">
            <AccordionTrigger>Knowledge graph — Fuseki (RDF)</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>Dataset <strong className="text-foreground">dialysis_kg</strong> · K8s: <code>fuseki-service.database:3030</code></p>
              <CodeBlock>{`PREFIX d: <http://health.example.org/dialysis#>
# Patient → Session → vitals, symptoms, interventions
# SPARQL UPDATE on start / note / end; DELETE on session remove`}</CodeBlock>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="neo4j">
            <AccordionTrigger>Property graph — Neo4j (Bolt)</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                The API uses the <strong className="text-foreground">Bolt</strong> protocol (port{' '}
                <strong>7687</strong>), not HTTP. HTTP port 7474 is only for Neo4j Browser.
              </p>
              <CodeBlock>{`# Backend pod (in cluster):
NEO4J_URI=bolt://neo4j.database.svc.cluster.local:7687

# Laptop / Browser (NodePort example):
Browser:  http://<NODE_IP>:31666/browser/
Bolt:     bolt://<NODE_IP>:31821

GET /health/neo4j  → { neo4j_available, uri, message }`}</CodeBlock>
              <CodeBlock>{`(Patient)-[:HAD_SESSION]->(Session)-[:FOLLOWED_BY]->(Session)
(Session)-[:HAD_SYMPTOM]->(Symptom)
(Session)-[:TRIGGERED]->(Alert)`}</CodeBlock>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="chroma">
            <AccordionTrigger>Vector store — Chroma</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>Collection <code>dialysis_notes</code> — notes and attachment text for semantic search in the AI assistant.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="api">
            <AccordionTrigger>REST API map</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <CodeBlock>{`POST   /auth/login                    patient | admin
GET    /patients/overview              admin
POST   /patients/                      admin create
DELETE /patients/{id}                 admin cascade

GET    /patients/{id}/sessions
GET    /patients/{id}/trends

POST   /sessions/start
GET    /sessions/{id}
POST   /sessions/{id}/vitals
GET    /sessions/{id}/vitals/workflow
POST   /sessions/{id}/note
POST   /sessions/{id}/attachment
POST   /sessions/{id}/end
POST   /sessions/{id}/evaluate
DELETE /sessions/{id}

GET    /medicines/                       medicine catalog
POST   /patients/{id}/nutrition-diary   Postgres → KG + Neo4j
GET    /patients/{id}/nutrition-diary

POST   /agent/clinical-summary
GET    /health/neo4j`}</CodeBlock>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="queries">
            <AccordionTrigger>Ops quick checks</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <CodeBlock>{`kubectl get pods -n database -l app=neo4j
kubectl get svc -n database neo4j
curl http://<API>:31175/health/neo4j

curl -u admin:PASSWORD http://fuseki-service.database:3030/$/datasets`}</CodeBlock>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI & alerting
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Rules:</strong> IDWG_HIGH, BP high/low (pre and
              interval), K_HIGH / K_LOW, fever, access, unstable post, note keywords.
            </p>
            <p>
              <strong className="text-foreground">LLM:</strong> Optional OpenAI summary and clinical Q&A
              over Postgres + Fuseki + Chroma + Neo4j.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="h-4 w-4" />
              Full reference
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            See <code>SriMaitreyi-app/ARCHITECTURE.md</code> in the repository for K8s deployment,
            security notes, and the complete file index.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
