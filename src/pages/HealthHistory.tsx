import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { MedicalRecordsUpload } from '@/components/clinical/MedicalRecordsUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  fetchHealthHistory,
  saveHealthHistory,
} from '@/services/api';
import type {
  HealthHistoryFamilyRow,
  HealthHistoryMedicationRow,
  HealthHistorySurgery,
  PatientHealthHistoryRecord,
} from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ClipboardList, Loader2, Plus, Save } from 'lucide-react';

const EMPTY_SURGERY = (): HealthHistorySurgery => ({
  approx_date: '',
  reason: '',
  complications_notes: '',
});

const EMPTY_MED = (): HealthHistoryMedicationRow => ({
  medication_name: '',
  dosage: '',
  frequency: '',
});

export default function HealthHistory() {
  const { patientId: routePatientId } = useParams<{ patientId?: string }>();
  const { patient, user, isAuthenticated, isPatient, isStaff, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const targetPatientId = routePatientId || patient?.id;
  const canEdit =
    isAdmin ||
    isStaff ||
    (isPatient && patient?.id === targetPatientId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState<PatientHealthHistoryRecord | null>(null);

  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [otherDiagnoses, setOtherDiagnoses] = useState('');
  const [surgeries, setSurgeries] = useState<HealthHistorySurgery[]>([
    EMPTY_SURGERY(),
    EMPTY_SURGERY(),
  ]);
  const [drugAllergiesNone, setDrugAllergiesNone] = useState(false);
  const [drugAllergiesList, setDrugAllergiesList] = useState('');
  const [foodAllergiesNone, setFoodAllergiesNone] = useState(false);
  const [foodAllergiesList, setFoodAllergiesList] = useState('');
  const [latexReaction, setLatexReaction] = useState<string>('');
  const [latexDetails, setLatexDetails] = useState('');
  const [medications, setMedications] = useState<HealthHistoryMedicationRow[]>([
    EMPTY_MED(),
    EMPTY_MED(),
    EMPTY_MED(),
  ]);
  const [familyRows, setFamilyRows] = useState<HealthHistoryFamilyRow[]>([]);
  const [tobaccoStatus, setTobaccoStatus] = useState('');
  const [tobaccoQuitDate, setTobaccoQuitDate] = useState('');
  const [tobaccoPacks, setTobaccoPacks] = useState('');
  const [alcoholStatus, setAlcoholStatus] = useState('');
  const [alcoholDrinks, setAlcoholDrinks] = useState('');
  const [drugsNever, setDrugsNever] = useState(true);
  const [drugsYes, setDrugsYes] = useState(false);
  const [drugsDetails, setDrugsDetails] = useState('');
  const [occupation, setOccupation] = useState('');

  const applyRecord = useCallback((data: PatientHealthHistoryRecord) => {
    setRecord(data);
    setFullName(data.full_name || patient?.name || '');
    setDateOfBirth(data.date_of_birth || '');
    setGender(data.gender || patient?.gender || '');
    setPhone(data.phone || '');
    setEmail(data.email || '');
    setEmergencyContactName(data.emergency_contact_name || '');
    setEmergencyContactPhone(data.emergency_contact_relationship_phone || '');
    setChiefComplaint(data.chief_complaint || '');
    setChronicConditions(data.chronic_conditions || []);
    setOtherDiagnoses(data.other_diagnoses || '');
    setSurgeries(
      data.surgeries?.length ? data.surgeries : [EMPTY_SURGERY(), EMPTY_SURGERY()]
    );
    setDrugAllergiesNone(data.drug_allergies_none ?? false);
    setDrugAllergiesList(data.drug_allergies_list || '');
    setFoodAllergiesNone(data.food_env_allergies_none ?? false);
    setFoodAllergiesList(data.food_env_allergies_list || '');
    setLatexReaction(data.latex_contrast_reaction || '');
    setLatexDetails(data.latex_contrast_details || '');
    setMedications(
      data.medications?.length
        ? data.medications
        : [EMPTY_MED(), EMPTY_MED(), EMPTY_MED()]
    );
    const familyDefaults =
      data.form_options?.family_conditions?.map((c) => ({
        condition: c.code,
        affected_relatives: '',
        notes_age_at_diagnosis: '',
      })) || [];
    if (data.family_rows?.length) {
      setFamilyRows(data.family_rows);
    } else {
      setFamilyRows(familyDefaults);
    }
    setTobaccoStatus(data.tobacco_status || '');
    setTobaccoQuitDate(data.tobacco_quit_date || '');
    setTobaccoPacks(data.tobacco_packs_per_day || '');
    setAlcoholStatus(data.alcohol_status || '');
    setAlcoholDrinks(data.alcohol_drinks_per_week || '');
    setDrugsNever(data.recreational_drugs_never ?? true);
    setDrugsYes(data.recreational_drugs_yes ?? false);
    setDrugsDetails(data.recreational_drugs_details || '');
    setOccupation(data.occupation || '');
  }, [patient?.name, patient?.gender]);

  const load = useCallback(async () => {
    if (!targetPatientId) return;
    setLoading(true);
    try {
      const data = await fetchHealthHistory(targetPatientId);
      applyRecord(data);
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to load health history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [targetPatientId, applyRecord, toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!targetPatientId) return <Navigate to="/login" replace />;
  if (isPatient && patient?.id !== targetPatientId) {
    return <Navigate to="/dashboard" replace />;
  }

  const chronicOptions = record?.form_options?.chronic_conditions || [];

  const toggleChronic = (code: string) => {
    setChronicConditions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const buildPayload = (markCompleted: boolean) => ({
    full_name: fullName,
    date_of_birth: dateOfBirth,
    gender,
    phone,
    email,
    emergency_contact_name: emergencyContactName,
    emergency_contact_relationship_phone: emergencyContactPhone,
    chief_complaint: chiefComplaint,
    chronic_conditions: chronicConditions,
    other_diagnoses: otherDiagnoses,
    drug_allergies_none: drugAllergiesNone,
    drug_allergies_list: drugAllergiesList,
    food_env_allergies_none: foodAllergiesNone,
    food_env_allergies_list: foodAllergiesList,
    latex_contrast_reaction: latexReaction || null,
    latex_contrast_details: latexDetails,
    tobacco_status: tobaccoStatus || null,
    tobacco_quit_date: tobaccoQuitDate,
    tobacco_packs_per_day: tobaccoPacks,
    alcohol_status: alcoholStatus || null,
    alcohol_drinks_per_week: alcoholDrinks,
    recreational_drugs_never: drugsNever,
    recreational_drugs_yes: drugsYes,
    recreational_drugs_details: drugsDetails,
    occupation,
    mark_completed: markCompleted,
    surgeries: surgeries.map(({ approx_date, reason, complications_notes }) => ({
      approx_date,
      reason,
      complications_notes,
    })),
    family_rows: familyRows.map(({ condition, affected_relatives, notes_age_at_diagnosis }) => ({
      condition,
      affected_relatives,
      notes_age_at_diagnosis,
    })),
    medications: medications.map(({ medication_name, dosage, frequency }) => ({
      medication_name,
      dosage,
      frequency,
    })),
  });

  const handleSave = async (markCompleted = false) => {
    if (!targetPatientId || !canEdit) return;
    setSaving(true);
    try {
      const data = await saveHealthHistory(targetPatientId, buildPayload(markCompleted));
      applyRecord(data);
      toast({
        title: markCompleted ? 'Health history completed' : 'Health history saved',
      });
    } catch (e) {
      console.error(e);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const backPath = isPatient ? '/dashboard' : isAdmin ? '/admin' : '/staff';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(backPath)} className="mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-primary" />
              Health history form
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Complete all sections to establish your clinical baseline.
            </p>
            {record?.completed_at && (
              <p className="text-xs text-emerald-600 mt-1">
                Completed: {new Date(record.completed_at).toLocaleString()}
              </p>
            )}
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving || loading}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving || loading}>
                Mark complete
              </Button>
            </div>
          )}
        </div>

        {targetPatientId && (
          <MedicalRecordsUpload patientId={targetPatientId} canEdit={canEdit} />
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={['1', '2', '3', '4', '5', '6', '7']} className="space-y-2">
            <AccordionItem value="1" className="border rounded-lg px-4">
              <AccordionTrigger>1. General patient demographics</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of birth</Label>
                    <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={gender} onValueChange={setGender} disabled={!canEdit}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-2">
                    <Label>Emerg. contact</Label>
                    <Input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship &amp; phone</Label>
                    <Input value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} disabled={!canEdit} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Chief complaint / reason for visit</Label>
                  <Textarea value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} disabled={!canEdit} rows={3} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="2" className="border rounded-lg px-4">
              <AccordionTrigger>2. Personal medical history (chronic conditions)</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <p className="text-sm text-muted-foreground">
                  Check conditions you have been diagnosed with or treated for:
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {chronicOptions.map((opt) => (
                    <label key={opt.code} className="flex items-start gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={chronicConditions.includes(opt.code)}
                        onCheckedChange={() => toggleChronic(opt.code)}
                        disabled={!canEdit}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Other diagnoses</Label>
                  <Textarea value={otherDiagnoses} onChange={(e) => setOtherDiagnoses(e.target.value)} disabled={!canEdit} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="3" className="border rounded-lg px-4">
              <AccordionTrigger>3. Past surgical &amp; hospitalization history</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                {surgeries.map((row, idx) => (
                  <div key={idx} className="grid gap-3 sm:grid-cols-3 border-b pb-4 last:border-0">
                    <div className="space-y-1">
                      <Label className="text-xs">Approx. date</Label>
                      <Input
                        value={row.approx_date || ''}
                        onChange={(e) => {
                          const next = [...surgeries];
                          next[idx] = { ...next[idx], approx_date: e.target.value };
                          setSurgeries(next);
                        }}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-xs">Operation / reason</Label>
                      <Input
                        value={row.reason || ''}
                        onChange={(e) => {
                          const next = [...surgeries];
                          next[idx] = { ...next[idx], reason: e.target.value };
                          setSurgeries(next);
                        }}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Complications / notes</Label>
                      <Input
                        value={row.complications_notes || ''}
                        onChange={(e) => {
                          const next = [...surgeries];
                          next[idx] = { ...next[idx], complications_notes: e.target.value };
                          setSurgeries(next);
                        }}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                ))}
                {canEdit && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setSurgeries([...surgeries, EMPTY_SURGERY()])}>
                    <Plus className="h-4 w-4 mr-1" /> Add row
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="4" className="border rounded-lg px-4">
              <AccordionTrigger>4. Allergies &amp; adverse reactions</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={drugAllergiesNone} onCheckedChange={(v) => setDrugAllergiesNone(!!v)} disabled={!canEdit} />
                    <Label>Drug allergies — None</Label>
                  </div>
                  <Label className="text-xs">List</Label>
                  <Input value={drugAllergiesList} onChange={(e) => setDrugAllergiesList(e.target.value)} disabled={!canEdit || drugAllergiesNone} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={foodAllergiesNone} onCheckedChange={(v) => setFoodAllergiesNone(!!v)} disabled={!canEdit} />
                    <Label>Food / environmental — None</Label>
                  </div>
                  <Input value={foodAllergiesList} onChange={(e) => setFoodAllergiesList(e.target.value)} disabled={!canEdit || foodAllergiesNone} />
                </div>
                <div className="space-y-2">
                  <Label>Latex or contrast dye?</Label>
                  <Select value={latexReaction} onValueChange={setLatexReaction} disabled={!canEdit}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Specific reaction details" value={latexDetails} onChange={(e) => setLatexDetails(e.target.value)} disabled={!canEdit} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="5" className="border rounded-lg px-4">
              <AccordionTrigger>5. Current medications &amp; supplements</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                {medications.map((med, idx) => (
                  <div key={idx} className="grid gap-3 sm:grid-cols-3 border-b pb-4 last:border-0">
                    <div className="space-y-1">
                      <Label className="text-xs">Medication / supplement</Label>
                      <Input
                        value={med.medication_name}
                        onChange={(e) => {
                          const next = [...medications];
                          next[idx] = { ...next[idx], medication_name: e.target.value };
                          setMedications(next);
                        }}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dosage</Label>
                      <Input
                        value={med.dosage || ''}
                        onChange={(e) => {
                          const next = [...medications];
                          next[idx] = { ...next[idx], dosage: e.target.value };
                          setMedications(next);
                        }}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Frequency</Label>
                      <Input
                        value={med.frequency || ''}
                        onChange={(e) => {
                          const next = [...medications];
                          next[idx] = { ...next[idx], frequency: e.target.value };
                          setMedications(next);
                        }}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                ))}
                {canEdit && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setMedications([...medications, EMPTY_MED()])}>
                    <Plus className="h-4 w-4 mr-1" /> Add medication
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="6" className="border rounded-lg px-4">
              <AccordionTrigger>6. Family health history</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                {familyRows.map((row, idx) => {
                  const label =
                    record?.form_options?.family_conditions?.find((c) => c.code === row.condition)?.label ||
                    row.condition;
                  return (
                    <div key={idx} className="grid gap-3 sm:grid-cols-3 border-b pb-4 last:border-0">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">{label}</Label>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Affected relative(s)</Label>
                        <Input
                          value={row.affected_relatives || ''}
                          onChange={(e) => {
                            const next = [...familyRows];
                            next[idx] = { ...next[idx], affected_relatives: e.target.value };
                            setFamilyRows(next);
                          }}
                          disabled={!canEdit}
                          placeholder="Mother, Father, Sibling…"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Notes / age at diagnosis</Label>
                        <Input
                          value={row.notes_age_at_diagnosis || ''}
                          onChange={(e) => {
                            const next = [...familyRows];
                            next[idx] = { ...next[idx], notes_age_at_diagnosis: e.target.value };
                            setFamilyRows(next);
                          }}
                          disabled={!canEdit}
                        />
                      </div>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="7" className="border rounded-lg px-4">
              <AccordionTrigger>7. Social &amp; lifestyle history</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label>Tobacco use</Label>
                  <Select value={tobaccoStatus} onValueChange={setTobaccoStatus} disabled={!canEdit}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="former">Former</SelectItem>
                      <SelectItem value="active">Active user</SelectItem>
                    </SelectContent>
                  </Select>
                  {tobaccoStatus === 'former' && (
                    <Input placeholder="Quit date" value={tobaccoQuitDate} onChange={(e) => setTobaccoQuitDate(e.target.value)} disabled={!canEdit} />
                  )}
                  {tobaccoStatus === 'active' && (
                    <Input placeholder="Packs per day" value={tobaccoPacks} onChange={(e) => setTobaccoPacks(e.target.value)} disabled={!canEdit} />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Alcohol use</Label>
                  <Select value={alcoholStatus} onValueChange={setAlcoholStatus} disabled={!canEdit}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="occasional">Occasional / social</SelectItem>
                      <SelectItem value="frequent">Frequent</SelectItem>
                    </SelectContent>
                  </Select>
                  {alcoholStatus === 'frequent' && (
                    <Input placeholder="Drinks per week" value={alcoholDrinks} onChange={(e) => setAlcoholDrinks(e.target.value)} disabled={!canEdit} />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Recreational drugs</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={drugsNever} onCheckedChange={(v) => { setDrugsNever(!!v); if (v) setDrugsYes(false); }} disabled={!canEdit} />
                      Never
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={drugsYes} onCheckedChange={(v) => { setDrugsYes(!!v); if (v) setDrugsNever(false); }} disabled={!canEdit} />
                      Yes
                    </label>
                  </div>
                  {drugsYes && (
                    <Textarea placeholder="Specify if comfortable" value={drugsDetails} onChange={(e) => setDrugsDetails(e.target.value)} disabled={!canEdit} />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Occupation</Label>
                  <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} disabled={!canEdit} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </main>
    </div>
  );
}
