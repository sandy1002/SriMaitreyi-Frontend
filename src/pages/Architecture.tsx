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
import { ArrowLeft, Database, GitBranch, Network, Brain } from 'lucide-react';

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
      <code>{children.trim()}</code>
    </pre>
  );
}

export default function ArchitecturePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-4xl space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Architecture</h1>
            <p className="text-muted-foreground mt-1">
              Data flow, storage schemas, and manual query guide for the Dialysis Monitoring App
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={isAuthenticated ? '/dashboard' : '/login'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isAuthenticated ? 'Back to dashboard' : 'Back to login'}
            </Link>
          </Button>
        </div>

        {/* Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              End-to-end session flow
            </CardTitle>
            <CardDescription>What happens from start → during → close</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border p-4 font-mono text-xs leading-6 bg-muted/40">
{`Patient UI (React)
    │
    ├─ POST /sessions/start     → PostgreSQL (session + pre_assessment)
    │                           → Fuseki KG (pre-dialysis triples)
    │                           → Rule engine → clinical_alerts
    │
    ├─ POST /sessions/{id}/note → PostgreSQL (session_notes)
    │                           → Fuseki (symptoms/interventions from text)
    │                           → Chroma (note embedding for semantic search)
    │                           → Re-run alerts
    │
    ├─ POST /sessions/{id}/attachment → PostgreSQL + disk (/uploads)
    │                           → PDF/text → Chroma (Phase 2)
    │
    ├─ POST /sessions/{id}/end  → PostgreSQL (post_assessment, summary)
    │                           → Fuseki (post-dialysis triples)
    │                           → Neo4j status + alerts
    │
    ├─ GET /patients/{id}/trends → weight series + Neo4j patterns (Phase 2)
    │
    └─ POST /agent/clinical-summary → Fuseki + Postgres + Chroma + Neo4j + OpenAI`}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Pre-dialysis</Badge>
              <Badge variant="secondary">Notes & attachments</Badge>
              <Badge>Post-dialysis</Badge>
              <Badge variant="outline">AI & alerts</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Where stored */}
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
                  <tr className="border-b"><td className="py-2">Patients, session metadata</td><td>PostgreSQL</td><td>—</td></tr>
                  <tr className="border-b"><td className="py-2">Pre/post vitals</td><td>PostgreSQL</td><td>Fuseki (typed properties)</td></tr>
                  <tr className="border-b"><td className="py-2">Note full text</td><td>PostgreSQL</td><td>Chroma (vector), Fuseki (NLP keywords)</td></tr>
                  <tr className="border-b"><td className="py-2">Attachments (files)</td><td>Disk <code className="text-xs">uploads/</code></td><td>Chroma if PDF/text extracted (Phase 2)</td></tr>
                  <tr className="border-b"><td className="py-2">Clinical alerts</td><td>PostgreSQL</td><td>Neo4j Alert nodes (Phase 2)</td></tr>
                  <tr className="border-b"><td className="py-2">Symptoms / interventions</td><td>Fuseki RDF</td><td>Neo4j HAD_SYMPTOM edges</td></tr>
                  <tr className="border-b"><td className="py-2">Session chains / trends</td><td>Neo4j</td><td>Postgres weight series in /trends</td></tr>
                  <tr><td className="py-2">Session summary</td><td>PostgreSQL</td><td>OpenAI-generated on close</td></tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Accordion type="multiple" className="w-full" defaultValue={['postgres', 'kg', 'neo4j', 'chroma', 'queries']}>
          {/* PostgreSQL */}
          <AccordionItem value="postgres">
            <AccordionTrigger>PostgreSQL schema (system of record)</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>Database: <strong className="text-foreground">dialysis</strong> · ORM: <code>app/db/models.py</code></p>
              <CodeBlock>{`patients
  id UUID PK, name, age, gender, created_at

dialysis_sessions
  id UUID PK, patient_id FK, session_date, hospital_name,
  status ('in-progress' | 'completed'), summary, created_at

session_pre_assessments
  session_id FK UNIQUE, weight_kg, blood_pressure, pulse,
  temperature, blood_sugar, uf_goal, access_condition

session_post_assessments
  session_id FK UNIQUE, post_weight_kg, post_bp, total_uf_removed,
  condition, technician_name, nurse_name, doctor_name

session_notes
  id UUID PK, session_id FK, note_text, created_at

session_attachments
  id UUID PK, session_id FK, file_name, file_type (MIME),
  file_path, category (image|audio|document), uploaded_at

clinical_alerts
  id UUID PK, session_id FK, patient_id FK,
  severity (low|medium|high), code, message, evidence JSON`}</CodeBlock>
              <p className="text-foreground font-medium">Example SQL</p>
              <CodeBlock>{`-- All sessions for a patient with pre vitals
SELECT s.*, pre.*
FROM dialysis_sessions s
LEFT JOIN session_pre_assessments pre ON pre.session_id = s.id
WHERE s.patient_id = '<patient-uuid>'
ORDER BY s.created_at DESC;

-- Open alerts
SELECT * FROM clinical_alerts
WHERE patient_id = '<patient-uuid>'
ORDER BY created_at DESC;`}</CodeBlock>
            </AccordionContent>
          </AccordionItem>

          {/* Fuseki KG */}
          <AccordionItem value="kg">
            <AccordionTrigger>Knowledge graph — Apache Jena Fuseki (RDF)</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Dataset: <strong className="text-foreground">dialysis_kg</strong> ·
                Base URL (K8s): <code>http://fuseki-service.database.svc.cluster.local:3030</code>
              </p>
              <p>Ontology prefix:</p>
              <CodeBlock>{`PREFIX d: <http://health.example.org/dialysis#>`}</CodeBlock>
              <p className="text-foreground font-medium">RDF schema (conceptual)</p>
              <CodeBlock>{`d:Patient
  a owl:Class .
d:DialysisSession
  a owl:Class .
d:Symptom / d:Intervention
  a owl:Class .

d:patient_{uuid} a d:Patient ;
    d:hasSession d:session_{uuid} .

d:session_{uuid} a d:DialysisSession ;
    d:hasWeight "72.5" ;
    d:hasBloodPressure "140/90" ;
    d:hasPulse "78" ;
    d:hasTemperature "36.8" ;
    d:hasBloodSugar "110" ;
    d:hasUFGoal "2.0 L" ;
    d:hasAccessCondition "Normal" ;
    d:hasPostWeight "70.1" ;
    d:hasPostBloodPressure "130/85" ;
    d:hasSymptom d:dizziness ;
    d:hasIntervention d:saline .

d:dizziness a d:Symptom .
d:saline a d:Intervention .`}</CodeBlock>
              <p className="text-foreground font-medium">Manual SPARQL query (GET)</p>
              <CodeBlock>{`# Browser or curl — query endpoint
GET /dialysis_kg/query?query=<URL-encoded SPARQL>&format=json

# Example: sessions and symptoms for a patient
PREFIX d: <http://health.example.org/dialysis#>
SELECT ?session ?symptom ?intervention
WHERE {
  d:patient_<PATIENT_UUID> d:hasSession ?session .
  OPTIONAL { ?session d:hasSymptom ?symptom }
  OPTIONAL { ?session d:hasIntervention ?intervention }
}`}</CodeBlock>
              <p className="text-foreground font-medium">Manual SPARQL update (POST)</p>
              <CodeBlock>{`curl -u admin:PASSWORD -X POST \\
  'http://fuseki-service.database.svc.cluster.local:3030/dialysis_kg/update' \\
  -H 'Content-Type: application/sparql-update' \\
  --data 'PREFIX d: <http://health.example.org/dialysis#>
INSERT DATA {
  d:session_<SESSION_UUID> d:hasSymptom d:nausea .
  d:nausea a d:Symptom .
}'`}</CodeBlock>
              <p>Admin: list datasets → <code>GET /$/datasets</code></p>
            </AccordionContent>
          </AccordionItem>

          {/* Neo4j */}
          <AccordionItem value="neo4j">
            <AccordionTrigger>Property graph — Neo4j (Phase 2)</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Synced from <code>app/graph/neo4j_service.py</code> on session start, notes, alerts, and delete.
                Disable with <code>NEO4J_ENABLED=false</code> if the cluster instance is unavailable.
              </p>
              <p className="text-foreground font-medium">Graph model</p>
              <CodeBlock>{`(p:Patient {id})-[:HAD_SESSION]->(s:Session {id, date})
(s)-[:HAD_SYMPTOM]->(sym:Symptom {name})
(s)-[:HAD_INTERVENTION]->(i:Intervention {name})
(s)-[:FOLLOWED_BY]->(s2:Session)
(s)-[:TRIGGERED]->(a:Alert {code, severity})`}</CodeBlock>
              <p className="text-foreground font-medium">Example Cypher</p>
              <CodeBlock>{`// Last 5 sessions with dizziness
MATCH (p:Patient {id: $patientId})-[:HAD_SESSION]->(s)-[:HAD_SYMPTOM]->(sym:Symptom {name: 'dizziness'})
RETURN s.id, s.date
ORDER BY s.date DESC
LIMIT 5;

// Sessions where patient was unstable after dialysis
MATCH (p:Patient {id: $patientId})-[:HAD_SESSION]->(s)
WHERE s.postCondition = 'Unstable'
RETURN s;`}</CodeBlock>
            </AccordionContent>
          </AccordionItem>

          {/* Chroma */}
          <AccordionItem value="chroma">
            <AccordionTrigger>Vector store — Chroma (semantic notes)</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Collection: <strong className="text-foreground">dialysis_notes</strong> ·
                Persisted under <code>./chroma</code> on the API pod.
              </p>
              <CodeBlock>{`# Note
metadata:  { session_id, patient_id, type: "note" }

# Attachment (PDF/text extract, Phase 2)
metadata:  { session_id, patient_id, type: "attachment", file_name }`}</CodeBlock>
              <p>Used by <code>/agent/clinical-summary</code> to find notes similar to the user question.</p>
              <p className="text-foreground font-medium">Query (Python / app)</p>
              <CodeBlock>{`from app.vector.chroma_client import collection
collection.query(
  query_texts=["chest pain during dialysis"],
  n_results=5,
  where={"patient_id": "<patient-uuid>"}
)`}</CodeBlock>
            </AccordionContent>
          </AccordionItem>

          {/* API */}
          <AccordionItem value="api">
            <AccordionTrigger>REST API map</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <CodeBlock>{`POST   /auth/login
GET    /patients/
POST   /patients/register
GET    /patients/{id}/sessions
GET    /patients/{id}/trends         → Phase 2 weight + graph insights

POST   /sessions/start              → session + pre + alerts + Neo4j
GET    /sessions/{id}               → session + notes + attachments + alerts
POST   /sessions/{id}/note          → note + KG + Chroma + alerts
POST   /sessions/{id}/attachment    → file upload
POST   /sessions/{id}/end           → post assessment + summary + alerts
POST   /sessions/{id}/evaluate      → re-run rules only

POST   /agent/clinical-summary      → AI answer + alerts + checks`}</CodeBlock>
            </AccordionContent>
          </AccordionItem>

          {/* Manual queries */}
          <AccordionItem value="queries">
            <AccordionTrigger>Quick manual checks (ops)</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p className="text-foreground font-medium">Fuseki — verify dataset exists</p>
              <CodeBlock>{`curl -u admin:PASSWORD \\
  http://fuseki-service.database.svc.cluster.local:3030/\\$/datasets`}</CodeBlock>
              <p className="text-foreground font-medium">Create dataset (if missing)</p>
              <CodeBlock>{`curl -u admin:PASSWORD -X POST \\
  'http://fuseki-service.database.svc.cluster.local:3030/\\$/datasets' \\
  -d 'dbName=dialysis_kg&dbType=tdb2'`}</CodeBlock>
              <p className="text-foreground font-medium">Backend health</p>
              <CodeBlock>{`curl http://<API_HOST>:31175/`}</CodeBlock>
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
              <strong className="text-foreground">Layer 1 — Rules</strong> (deterministic): BP high/low,
              fever, abnormal access, unstable post-condition, risky phrases in notes. Results stored in{' '}
              <code>clinical_alerts</code> and shown as &quot;checks&quot; in the UI.
            </p>
            <p>
              <strong className="text-foreground">Layer 2 — LLM</strong> (optional,{' '}
              <code>OPENAI_API_KEY</code>): explains context from Postgres + Fuseki + Chroma. Does not
              replace clinical judgment.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phase 2 status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            <Badge>Neo4j sync</Badge>
            <Badge variant="secondary">IDWG_HIGH alert</Badge>
            <Badge variant="secondary">PDF → Chroma</Badge>
            <Badge variant="outline">KG delete on cascade</Badge>
            <Badge variant="outline">Patient trends UI</Badge>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="h-4 w-4" />
              Full markdown reference
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            See <code>SriMaitreyi-app/ARCHITECTURE.md</code> in the repository for the complete
            architecture document including K8s deployment and security notes.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
