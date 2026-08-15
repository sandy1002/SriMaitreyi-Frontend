import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PadocIngestPreview } from '@/services/padocApi';

function formatConfidence(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Math.round(value * 100)}%`;
}

function recordColumns(records: Record<string, unknown>[]): string[] {
  const keys = new Set<string>();
  for (const row of records) {
    Object.keys(row ?? {}).forEach((key) => keys.add(key));
  }
  return Array.from(keys);
}

function cellValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function PadocIngestPreviewPanel({ preview }: { preview: PadocIngestPreview }) {
  const records = Array.isArray(preview.preview?.records) ? preview.preview.records : [];
  const warnings = preview.preview?.warnings ?? [];
  const tables = preview.schema?.postgres?.tables ?? [];
  const nodes = preview.schema?.knowledge_graph?.nodes ?? [];
  const relationships = preview.schema?.knowledge_graph?.relationships ?? [];
  const columns = recordColumns(records);
  const classification = preview.classification;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
        Preview only — not saved to Postgres or the knowledge graph.
      </div>

      <Card className="border-slate-800 bg-slate-950">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-50">Classification</CardTitle>
          <CardDescription className="text-slate-400">
            {preview.source?.filename ?? 'Document'} · {preview.source?.format ?? 'unknown'}
            {preview.source?.parse_mode ? ` · ${preview.source.parse_mode}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            {classification?.document_type ? (
              <Badge variant="secondary">{classification.document_type}</Badge>
            ) : null}
            {classification?.domain ? <Badge variant="outline">{classification.domain}</Badge> : null}
            <Badge variant="outline">confidence {formatConfidence(classification?.confidence)}</Badge>
          </div>
          {classification?.title ? (
            <p className="font-semibold text-slate-100">{classification.title}</p>
          ) : null}
          {classification?.summary ? (
            <p className="text-slate-300 whitespace-pre-wrap">{classification.summary}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-950">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-50">Preview records</CardTitle>
          <CardDescription className="text-slate-400">
            {records.length} row{records.length === 1 ? '' : 's'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {warnings.length > 0 ? (
            <ul className="list-disc pl-5 text-sm text-amber-200 space-y-1">
              {warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          ) : null}
          {records.length === 0 ? (
            <p className="text-sm text-slate-500">No preview records returned.</p>
          ) : (
            <div className="max-h-72 overflow-auto rounded-md border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 sticky top-0">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="px-2 py-1.5 font-medium text-slate-300 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((row, index) => (
                    <tr key={index} className="border-t border-slate-800">
                      {columns.map((col) => (
                        <td key={col} className="px-2 py-1.5 text-slate-200 align-top max-w-[16rem] truncate">
                          {cellValue(row?.[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-950">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-50">Proposed Postgres tables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tables.length === 0 ? (
            <p className="text-sm text-slate-500">No table proposals.</p>
          ) : (
            tables.map((table) => (
              <div key={table.name} className="space-y-1">
                <p className="text-sm font-medium text-slate-100">{table.name}</p>
                {table.description ? (
                  <p className="text-xs text-slate-400">{table.description}</p>
                ) : null}
                <div className="overflow-auto rounded-md border border-slate-800">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-900">
                      <tr>
                        <th className="px-2 py-1.5 text-left">Column</th>
                        <th className="px-2 py-1.5 text-left">Type</th>
                        <th className="px-2 py-1.5 text-left">Nullable</th>
                        <th className="px-2 py-1.5 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(table.columns ?? []).map((col) => (
                        <tr key={col.name} className="border-t border-slate-800">
                          <td className="px-2 py-1.5 font-mono">{col.name}</td>
                          <td className="px-2 py-1.5">{col.type}</td>
                          <td className="px-2 py-1.5">{col.nullable ? 'yes' : 'no'}</td>
                          <td className="px-2 py-1.5 text-slate-400">{col.description ?? ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-950">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-50">Proposed knowledge graph</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Nodes</p>
            {nodes.length === 0 ? (
              <p className="text-slate-500">None</p>
            ) : (
              <ul className="space-y-2">
                {nodes.map((node) => (
                  <li key={`${node.label}-${node.key}`} className="rounded-md border border-slate-800 p-2">
                    <p className="font-medium">{node.label}</p>
                    <p className="text-xs text-slate-400">key: {node.key}</p>
                    {node.properties?.length ? (
                      <p className="text-xs text-slate-400 mt-1">{node.properties.join(', ')}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Relationships</p>
            {relationships.length === 0 ? (
              <p className="text-slate-500">None</p>
            ) : (
              <ul className="space-y-2">
                {relationships.map((rel, index) => (
                  <li key={`${rel.type}-${rel.from}-${rel.to}-${index}`} className="rounded-md border border-slate-800 p-2">
                    <p className="font-medium">
                      {rel.from} → {rel.to}
                    </p>
                    <p className="text-xs text-slate-400">{rel.type}</p>
                    {rel.description ? (
                      <p className="text-xs text-slate-400 mt-1">{rel.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Button type="button" disabled title="Persist API is not available yet">
        Confirm &amp; save
      </Button>
    </div>
  );
}
