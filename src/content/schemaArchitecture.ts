/** Admin-only schema reference — mirrors SriMaitreyi-app/ARCHITECTURE.md */

export const STORE_ROLES = [
  {
    store: 'PostgreSQL',
    role: 'System of record (source of truth)',
    color: 'bg-blue-500/10 border-blue-500/30',
  },
  {
    store: 'Fuseki (RDF KG)',
    role: 'Clinical ontology & SPARQL reasoning',
    color: 'bg-violet-500/10 border-violet-500/30',
  },
  {
    store: 'Neo4j',
    role: 'Temporal paths, trends, alert chains',
    color: 'bg-emerald-500/10 border-emerald-500/30',
  },
  {
    store: 'Chroma',
    role: 'Semantic search on note & PDF text',
    color: 'bg-amber-500/10 border-amber-500/30',
  },
  {
    store: 'Local disk (uploads/)',
    role: 'Binary attachments; PG holds metadata path',
    color: 'bg-slate-500/10 border-slate-500/30',
  },
] as const;

export const DATA_PLACEMENT: {
  domain: string;
  postgres: string;
  fuseki: string;
  neo4j: string;
  chroma: string;
  files: string;
}[] = [
  {
    domain: 'Patient demographics & dry weight',
    postgres: 'patients',
    fuseki: 'd:Patient',
    neo4j: ':Patient node',
    chroma: '—',
    files: '—',
  },
  {
    domain: 'Dialysis session metadata & summary',
    postgres: 'dialysis_sessions',
    fuseki: 'd:DialysisSession',
    neo4j: ':Session + HAD_SESSION',
    chroma: '—',
    files: '—',
  },
  {
    domain: 'Pre / post dialysis vitals & UF',
    postgres: 'session_pre/post_assessments, session_vital_readings',
    fuseki: 'Pre/post literal properties on session',
    neo4j: 'Session properties (partial)',
    chroma: '—',
    files: '—',
  },
  {
    domain: 'Session notes (full text)',
    postgres: 'session_notes',
    fuseki: 'Symptom / Intervention keywords only',
    neo4j: 'HAD_SYMPTOM edges',
    chroma: 'Embeddings (dialysis_notes)',
    files: '—',
  },
  {
    domain: 'Session attachments',
    postgres: 'session_attachments (path, type)',
    fuseki: '—',
    neo4j: '—',
    chroma: 'PDF / extracted text',
    files: 'uploads/{session_id}/…',
  },
  {
    domain: 'Clinical alerts',
    postgres: 'clinical_alerts',
    fuseki: '—',
    neo4j: ':Alert TRIGGERED from Session',
    chroma: '—',
    files: '—',
  },
  {
    domain: 'Nutrition diary (meals, K, Na, P)',
    postgres: 'nutrition_diary_entries → meals → nutrients',
    fuseki: 'd:NutritionDiary, d:Meal, d:NutrientAmount',
    neo4j: ':NutritionDiary HAD_MEAL',
    chroma: '—',
    files: '—',
  },
  {
    domain: 'Renal fluid diary',
    postgres: 'renal_fluid_diary_entries → intake lines',
    fuseki: '—',
    neo4j: '—',
    chroma: '—',
    files: '—',
  },
  {
    domain: 'Medication diary (home)',
    postgres: 'medication_diary_entries → intakes',
    fuseki: '—',
    neo4j: '—',
    chroma: '—',
    files: '—',
  },
  {
    domain: 'Session medication intakes',
    postgres: 'session_medication_intakes',
    fuseki: '—',
    neo4j: '—',
    chroma: '—',
    files: '—',
  },
  {
    domain: 'Prescribed medicines catalog',
    postgres: 'medicines, patient_medications',
    fuseki: '—',
    neo4j: '—',
    chroma: '—',
    files: '—',
  },
  {
    domain: 'CBP lab reports',
    postgres: 'patient_cbp_reports (wide columns)',
    fuseki: 'd:CbpReport + lab predicates',
    neo4j: ':CbpReport HAD_LAB_REPORT',
    chroma: '—',
    files: '—',
  },
  {
    domain: 'Lipid / liver panels',
    postgres: 'patient_lab_investigations (results_json)',
    fuseki: '—',
    neo4j: '—',
    chroma: '—',
    files: '—',
  },
  {
    domain: 'Vaccine diary',
    postgres: 'vaccine_diary_entries → intakes',
    fuseki: '—',
    neo4j: '—',
    chroma: '—',
    files: '—',
  },
  {
    domain: 'Baseline health history',
    postgres: 'patient_health_histories + child tables',
    fuseki: '—',
    neo4j: '—',
    chroma: 'Health form PDF text',
    files: 'patient_health_history_attachments',
  },
  {
    domain: 'Medical PDF reports',
    postgres: 'Aggregated at request time from PG',
    fuseki: '—',
    neo4j: '—',
    chroma: '—',
    files: 'Generated PDF (not persisted)',
  },
];

export const POSTGRES_ER = `┌─────────────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL (dialysis) — ER overview                  │
└─────────────────────────────────────────────────────────────────────────────┘

  patients ─────┬──── dialysis_sessions ─────┬──── session_pre_assessments (1:1)
                │                            ├──── session_post_assessments (1:1)
                │                            ├──── session_vital_readings (1:N)
                │                            ├──── session_notes (1:N)
                │                            ├──── session_attachments (1:N)
                │                            ├──── session_medication_intakes (1:N)
                │                            └──── clinical_alerts (1:N)
                │
                ├──── patient_medications ──── medicines (catalog)
                │
                ├──── nutrition_diary_entries ── nutrition_meals ── meal_nutrients
                │                              └─ meal_medication_intakes
                │                              └─ nutrition_alerts
                │
                ├──── renal_fluid_diary_entries ── renal_fluid_intake_lines
                │
                ├──── medication_diary_entries ── medication_diary_intakes
                │
                ├──── vaccine_diary_entries ── vaccine_diary_intakes
                │
                ├──── patient_cbp_reports
                ├──── patient_lab_investigations (lipid_profile | liver_function JSON)
                │
                ├──── patient_health_histories ──┬── surgeries / family / meds rows
                │                                └── (1:1 per patient)
                └──── patient_health_history_attachments

  Rule: All CRUD, reports, and UI reads/writes go through PostgreSQL first.`;

export const FUSEKI_ER = `┌─────────────────────────────────────────────────────────────────────────────┐
│              Knowledge Graph — Fuseki dataset: dialysis_kg (RDF)               │
│              PREFIX d: <http://health.example.org/dialysis#>                   │
└─────────────────────────────────────────────────────────────────────────────┘

  d:Patient ──d:hasSession──► d:DialysisSession
       │                           │
       │                           ├── d:hasWeight, d:hasBloodPressure, d:hasPulse …
       │                           ├── d:hasSymptom ──► d:Symptom
       │                           └── d:hasIntervention ──► d:Intervention
       │
       ├── d:hasNutritionDiary ──► d:NutritionDiary ──d:hasMeal──► d:Meal
       │                                              └── d:hasNutrientAmount ──► d:NutrientAmount
       │
       └── d:hasCbpReport ──► d:CbpReport (hemoglobin, creatinine, K+, URR fields …)

  Written by: kg_service.py on session start/end, note keywords, nutrition save, CBP save
  Read by: SPARQL (sparql_reader.py), clinical AI agent
  Not stored: PDF bytes, full note bodies, fluid/medication diaries (Postgres only)`;

export const NEO4J_ER = `┌─────────────────────────────────────────────────────────────────────────────┐
│                    Property Graph — Neo4j (Bolt :7687)                        │
└─────────────────────────────────────────────────────────────────────────────┘

  (Patient {id})──[:HAD_SESSION]──►(Session {id, date, hospital, status})
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
            [:FOLLOWED_BY]         [:HAD_SYMPTOM]        [:TRIGGERED]
         (prev Session)──►              │                    │
                                        ▼                    ▼
                                  (Symptom)              (Alert {code, severity})

  (Patient)──[:HAD_NUTRITION_DIARY]──►(NutritionDiary)──[:HAD_MEAL]──►(Meal)

  (Patient)──[:HAD_LAB_REPORT]──►(CbpReport {date, hemoglobin, K+, …})

  Sync: neo4j_service.py + sync_service.py (best-effort; NEO4J_ENABLED flag)
  Use for: /patients/{id}/trends, recurring symptoms, session chains
  Not stored: Full diary rows, health history, lipid/liver JSON panels`;

export const MULTI_STORE_FLOW = `                    ┌──────────────┐
                    │  React UI    │
                    └──────┬───────┘
                           │ REST
                    ┌──────▼───────┐
                    │   FastAPI    │
                    └──────┬───────┘
         ┌─────────────────┼─────────────────┬──────────────┐
         │                 │                 │              │
    ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐  ┌─────▼─────┐
    │ Postgres │      │  Fuseki   │     │   Neo4j   │  │  Chroma   │
    │ (truth)  │      │   (RDF)   │     │ (paths)   │  │ (vectors) │
    └──────────┘      └───────────┘     └───────────┘  └───────────┘
         │
    ┌────▼────┐
    │ uploads/│  session & health-history files
    └─────────┘`;
