'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, Input, Badge } from '@zuzz/ui';
import { api, API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Upload, X, GripVertical, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const STEPS = [
  { step: 1, label: 'זיהוי רכב' },
  { step: 2, label: 'פרטי הרכב' },
  { step: 3, label: 'הצהרות מוכר' },
  { step: 4, label: 'תמחור ומיקום' },
  { step: 5, label: 'תמונות' },
  { step: 6, label: 'מסמכים' },
  { step: 7, label: 'תצוגה מקדימה' },
];

interface MediaItem {
  id: string;
  url: string;
  order: number;
}

interface DocItem {
  id: string;
  type: string;
  name: string;
  verificationStatus: string;
}

export default function CreateCarPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [listingId, setListingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<DocItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState('vehicle_license');

  const [formData, setFormData] = useState({
    licensePlate: '',
    make: '',
    model: '',
    trim: '',
    year: new Date().getFullYear(),
    mileage: 0,
    handCount: 0,
    ownershipType: 'private',
    gearbox: 'automatic',
    fuelType: 'petrol',
    engineVolume: 0,
    horsepower: 0,
    seats: 5,
    color: '',
    interiorColor: '',
    bodyType: 'sedan',
    testUntil: '',
    accidentDeclared: false,
    accidentDetails: '',
    engineReplaced: false,
    gearboxReplaced: false,
    frameDamage: false,
    maintenanceHistory: '',
    numKeys: 2,
    warrantyExists: false,
    warrantyDetails: '',
    recallStatus: 'none',
    personalImport: false,
    priceAmount: 0,
    isNegotiable: false,
    city: '',
    region: '',
    description: '',
    isElectric: false,
    batteryCapacity: 0,
    rangeKm: 0,
    batteryHealth: 100,
    acChargeKw: 0,
    dcChargeKw: 0,
    chargeConnectorType: '',
  });

  const update = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">יש להתחבר כדי לפרסם מודעה</h1>
        <Button onClick={() => (window.location.href = '/auth/login')}>התחברות</Button>
      </div>
    );
  }

  async function handleLookup() {
    if (!formData.licensePlate) return;
    setLookupLoading(true);
    setError('');
    try {
      const plate = formData.licensePlate.replace(/-/g, '');
      const res = await api.get<{ success: boolean; data: any; message?: string }>(
        `/api/cars/lookup/${plate}`,
      );
      if (res.data) {
        setFormData((prev) => ({
          ...prev,
          make: res.data.make || prev.make,
          model: res.data.model || prev.model,
          year: res.data.year || prev.year,
          fuelType: res.data.fuelType || prev.fuelType,
          gearbox: res.data.gearbox || prev.gearbox,
          color: res.data.color || prev.color,
          bodyType: res.data.bodyType || prev.bodyType,
          seats: res.data.seats || prev.seats,
          engineVolume: res.data.engineVolume || prev.engineVolume,
          testUntil: res.data.testUntil || prev.testUntil,
          ownershipType: res.data.ownershipType || prev.ownershipType,
          isElectric: res.data.isElectric || prev.isElectric,
          batteryCapacity: res.data.batteryCapacity || prev.batteryCapacity,
          rangeKm: res.data.rangeKm || prev.rangeKm,
        }));
      } else {
        setError('רכב לא נמצא. ניתן להזין פרטים ידנית.');
      }
    } catch {
      setError('שגיאה בחיפוש. ניתן להזין פרטים ידנית.');
    } finally {
      setLookupLoading(false);
    }
  }

  async function createDraft() {
    const res = await api.post<{ success: boolean; data: { id: string } }>('/api/cars', {});
    setListingId(res.data.id);
    return res.data.id;
  }

  async function saveDetails(id: string) {
    await api.put(`/api/cars/${id}/details`, {
      make: formData.make,
      model: formData.model,
      trim: formData.trim,
      year: formData.year,
      mileage: formData.mileage,
      handCount: formData.handCount,
      ownershipType: formData.ownershipType,
      gearbox: formData.gearbox,
      fuelType: formData.fuelType,
      engineVolume: formData.engineVolume || undefined,
      horsepower: formData.horsepower || undefined,
      seats: formData.seats || undefined,
      color: formData.color || undefined,
      interiorColor: formData.interiorColor || undefined,
      bodyType: formData.bodyType || undefined,
      testUntil: formData.testUntil || undefined,
    });
  }

  async function saveStatements(id: string) {
    await api.put(`/api/cars/${id}/statements`, {
      accidentDeclared: formData.accidentDeclared,
      accidentDetails: formData.accidentDetails || undefined,
      engineReplaced: formData.engineReplaced,
      gearboxReplaced: formData.gearboxReplaced,
      frameDamage: formData.frameDamage,
      maintenanceHistory: formData.maintenanceHistory || undefined,
      numKeys: formData.numKeys,
      warrantyExists: formData.warrantyExists,
      warrantyDetails: formData.warrantyDetails || undefined,
      recallStatus: formData.recallStatus || undefined,
      personalImport: formData.personalImport,
    });
  }

  async function savePricingAndLocation(id: string) {
    await api.put(`/api/cars/${id}/pricing`, {
      price: { amount: formData.priceAmount, currency: 'ILS' },
      isNegotiable: formData.isNegotiable,
    });
    if (formData.city) {
      await api.put(`/api/cars/${id}/location`, { city: formData.city, region: formData.region });
    }
  }

  async function handleNext() {
    setSaving(true);
    setError('');
    try {
      let id = listingId;
      if (currentStep === 1) {
        if (!formData.make || !formData.model) {
          setError('יש להזין יצרן ודגם');
          setSaving(false);
          return;
        }
        if (!id) id = await createDraft();
        await saveDetails(id!);
      } else if (currentStep === 2) {
        await saveDetails(id!);
      } else if (currentStep === 3) {
        await saveStatements(id!);
      } else if (currentStep === 4) {
        if (formData.priceAmount <= 0) {
          setError('יש להזין מחיר');
          setSaving(false);
          return;
        }
        if (!formData.city) {
          setError('יש להזין עיר');
          setSaving(false);
          return;
        }
        await savePricingAndLocation(id!);
      }
      setCurrentStep((prev) => Math.min(prev + 1, 7));
    } catch (e: any) {
      setError(e.message || 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadMedia(files: FileList) {
    if (!listingId || !files.length) return;
    setUploading(true);
    try {
      const formDataObj = new FormData();
      Array.from(files).forEach((f) => formDataObj.append('files', f));

      const res = await fetch(`${API_BASE_URL}/api/upload/listing/${listingId}/media`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formDataObj,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUploadedMedia((prev) => [...prev, ...json.data]);
      }
    } catch {
      setError('שגיאה בהעלאת תמונות');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteMedia(mediaId: string) {
    try {
      await api.delete(`/api/upload/media/${mediaId}`);
      setUploadedMedia((prev) => prev.filter((m) => m.id !== mediaId));
    } catch {
      // ignore
    }
  }

  async function handleUploadDoc(file: File) {
    if (!listingId) return;
    setUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('type', selectedDocType);

      const res = await fetch(`${API_BASE_URL}/api/upload/listing/${listingId}/document`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formDataObj,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUploadedDocs((prev) => [...prev, json.data]);
      }
    } catch {
      setError('שגיאה בהעלאת מסמך');
    } finally {
      setUploading(false);
    }
  }

  async function handlePublish() {
    if (!listingId) return;
    setPublishing(true);
    setError('');
    try {
      await api.post(`/api/cars/${listingId}/publish`);
      router.push(`/cars/${listingId}`);
    } catch (e: any) {
      setError(e.message || 'שגיאה בפרסום');
      setPublishing(false);
    }
  }

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6 text-brand-black tracking-tight">פרסום רכב למכירה</h1>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s) => (
          <button
            key={s.step}
            onClick={() => s.step <= currentStep && listingId && setCurrentStep(s.step)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              s.step === currentStep
                ? 'bg-brand-500 text-white'
                : s.step < currentStep
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white/20">
              {s.step < currentStep ? '\u2713' : s.step}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          {/* Step 1: Identify */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-brand-black tracking-tight">זיהוי הרכב</h2>
              <p className="text-sm text-gray-500">הזן מספר רישוי לחיפוש אוטומטי, או הזן ידנית</p>
              <div className="flex gap-2">
                <Input
                  label="מספר רישוי"
                  placeholder="12-345-67"
                  value={formData.licensePlate}
                  onChange={(e) => update('licensePlate', e.target.value)}
                  className="flex-1"
                  dir="ltr"
                />
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={handleLookup}
                    loading={lookupLoading}
                    disabled={!formData.licensePlate}
                  >
                    חפש
                  </Button>
                </div>
              </div>
              <div className="text-center text-sm text-gray-400">או הזן ידנית</div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="יצרן *"
                  placeholder="Toyota"
                  value={formData.make}
                  onChange={(e) => update('make', e.target.value)}
                />
                <Input
                  label="דגם *"
                  placeholder="Corolla"
                  value={formData.model}
                  onChange={(e) => update('model', e.target.value)}
                />
              </div>
              <Input
                label="שנה *"
                type="number"
                value={String(formData.year)}
                onChange={(e) => update('year', Number(e.target.value))}
              />
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-brand-black tracking-tight">פרטי הרכב</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="יצרן"
                  value={formData.make}
                  onChange={(e) => update('make', e.target.value)}
                />
                <Input
                  label="דגם"
                  value={formData.model}
                  onChange={(e) => update('model', e.target.value)}
                />
                <Input
                  label="גרסה"
                  value={formData.trim}
                  onChange={(e) => update('trim', e.target.value)}
                />
                <Input
                  label="שנה"
                  type="number"
                  value={String(formData.year)}
                  onChange={(e) => update('year', Number(e.target.value))}
                />
                <Input
                  label="קילומטראז׳"
                  type="number"
                  value={String(formData.mileage)}
                  onChange={(e) => update('mileage', Number(e.target.value))}
                />
                <Input
                  label="יד"
                  type="number"
                  value={String(formData.handCount)}
                  onChange={(e) => update('handCount', Number(e.target.value))}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תיבת הילוכים
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={formData.gearbox}
                    onChange={(e) => update('gearbox', e.target.value)}
                  >
                    <option value="automatic">אוטומטית</option>
                    <option value="manual">ידנית</option>
                    <option value="robotic">רובוטית</option>
                    <option value="cvt">CVT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סוג דלק</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={formData.fuelType}
                    onChange={(e) => update('fuelType', e.target.value)}
                  >
                    <option value="petrol">בנזין</option>
                    <option value="diesel">דיזל</option>
                    <option value="hybrid">היברידי</option>
                    <option value="phev">PHEV</option>
                    <option value="electric">חשמלי</option>
                    <option value="lpg">גז</option>
                  </select>
                </div>
                <Input
                  label="נפח מנוע (סמ״ק)"
                  type="number"
                  value={String(formData.engineVolume)}
                  onChange={(e) => update('engineVolume', Number(e.target.value))}
                />
                <Input
                  label="כוח סוס"
                  type="number"
                  value={String(formData.horsepower)}
                  onChange={(e) => update('horsepower', Number(e.target.value))}
                />
                <Input
                  label="צבע"
                  value={formData.color}
                  onChange={(e) => update('color', e.target.value)}
                />
                <Input
                  label="טסט עד"
                  type="date"
                  value={formData.testUntil}
                  onChange={(e) => update('testUntil', e.target.value)}
                />
              </div>
              {(formData.fuelType === 'electric' || formData.fuelType === 'phev') && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-green-700 mb-3">נתוני רכב חשמלי</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="קיבולת סוללה (kWh)"
                      type="number"
                      value={String(formData.batteryCapacity)}
                      onChange={(e) => update('batteryCapacity', Number(e.target.value))}
                    />
                    <Input
                      label='טווח נסיעה (ק"מ)'
                      type="number"
                      value={String(formData.rangeKm)}
                      onChange={(e) => update('rangeKm', Number(e.target.value))}
                    />
                    <Input
                      label="בריאות סוללה (%)"
                      type="number"
                      value={String(formData.batteryHealth)}
                      onChange={(e) => update('batteryHealth', Number(e.target.value))}
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Statements */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-brand-black tracking-tight">הצהרות מוכר</h2>
              <p className="text-sm text-gray-500">
                נא לענות בכנות — הצהרות אלו משפיעות על ציון האמון
              </p>
              <Checkbox
                label="האם היו תאונות?"
                checked={formData.accidentDeclared}
                onChange={(v) => update('accidentDeclared', v)}
              />
              {formData.accidentDeclared && (
                <Input
                  label="פרטי התאונה"
                  value={formData.accidentDetails}
                  onChange={(e) => update('accidentDetails', e.target.value)}
                />
              )}
              <Checkbox
                label="מנוע הוחלף?"
                checked={formData.engineReplaced}
                onChange={(v) => update('engineReplaced', v)}
              />
              <Checkbox
                label="תיבת הילוכים הוחלפה?"
                checked={formData.gearboxReplaced}
                onChange={(v) => update('gearboxReplaced', v)}
              />
              <Checkbox
                label="נזק לשלדה?"
                checked={formData.frameDamage}
                onChange={(v) => update('frameDamage', v)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  היסטוריית טיפולים
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={formData.maintenanceHistory}
                  onChange={(e) => update('maintenanceHistory', e.target.value)}
                >
                  <option value="">בחר</option>
                  <option value="full_agency">שירות מלא בסוכנות</option>
                  <option value="partial_agency">חלקי בסוכנות</option>
                  <option value="independent">מוסך עצמאי</option>
                  <option value="none">אין היסטוריה</option>
                </select>
              </div>
              <Input
                label="מספר מפתחות"
                type="number"
                value={String(formData.numKeys)}
                onChange={(e) => update('numKeys', Number(e.target.value))}
              />
              <Checkbox
                label="אחריות בתוקף?"
                checked={formData.warrantyExists}
                onChange={(v) => update('warrantyExists', v)}
              />
              {formData.warrantyExists && (
                <Input
                  label="פרטי אחריות"
                  value={formData.warrantyDetails}
                  onChange={(e) => update('warrantyDetails', e.target.value)}
                />
              )}
              <Checkbox
                label="יבוא אישי?"
                checked={formData.personalImport}
                onChange={(v) => update('personalImport', v)}
              />
            </div>
          )}

          {/* Step 4: Pricing + Location */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-brand-black tracking-tight">תמחור ומיקום</h2>
              <Input
                label="מחיר (\u20AA) *"
                type="number"
                value={String(formData.priceAmount)}
                onChange={(e) => update('priceAmount', Number(e.target.value))}
              />
              <Checkbox
                label="ניתן למשא ומתן"
                checked={formData.isNegotiable}
                onChange={(v) => update('isNegotiable', v)}
              />
              <Input
                label="עיר *"
                placeholder="תל אביב-יפו"
                value={formData.city}
                onChange={(e) => update('city', e.target.value)}
              />
              <Input
                label="אזור"
                placeholder="מרכז"
                value={formData.region}
                onChange={(e) => update('region', e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור (אופציונלי)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="הוסף תיאור חופשי על הרכב..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 5: Photos */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-brand-black tracking-tight">תמונות</h2>
              <p className="text-sm text-gray-500">הוסף תמונות של הרכב (עד 20 תמונות)</p>

              {uploadedMedia.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {uploadedMedia.map((media, idx) => (
                    <div
                      key={media.id}
                      className="relative group aspect-[4/3] rounded-lg overflow-hidden border"
                    >
                      <img
                        src={`${API_BASE_URL}${media.url}`}
                        alt={`תמונה ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleDeleteMedia(media.id)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-brand-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                          ראשית
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-12 h-12 mx-auto text-brand-500 animate-spin mb-3" />
                ) : (
                  <Upload className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                )}
                <p className="text-gray-500 mb-2">{uploading ? 'מעלה...' : 'לחץ לבחירת תמונות'}</p>
                <p className="text-xs text-gray-400">JPG, PNG או WebP, עד 10MB כל אחת</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleUploadMedia(e.target.files)}
              />
            </div>
          )}

          {/* Step 6: Documents */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-brand-black tracking-tight">מסמכים</h2>
              <p className="text-sm text-gray-500">העלאת מסמכים מעלה את ציון האמון של המודעה</p>

              {uploadedDocs.length > 0 && (
                <div className="space-y-2">
                  {uploadedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-green-50"
                    >
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-sm flex-1">{doc.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {doc.verificationStatus === 'verified' ? 'מאומת' : 'ממתין לאימות'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סוג מסמך</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                  >
                    <option value="vehicle_license">רישיון רכב</option>
                    <option value="vehicle_test">תעודת טסט</option>
                    <option value="insurance">ביטוח</option>
                    <option value="inspection_report">דו״ח בדיקה</option>
                    <option value="ownership_proof">הוכחת בעלות</option>
                    <option value="other">אחר</option>
                  </select>
                </div>
                <div
                  onClick={() => docInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-400 transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-8 h-8 mx-auto text-brand-500 animate-spin mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  )}
                  <p className="text-gray-500 text-sm">
                    {uploading ? 'מעלה...' : 'לחץ להעלאת מסמך'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG או PNG</p>
                </div>
                <input
                  ref={docInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUploadDoc(e.target.files[0])}
                />
              </div>
            </div>
          )}

          {/* Step 7: Preview */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-brand-black tracking-tight">תצוגה מקדימה</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                {uploadedMedia.length > 0 && (
                  <img
                    src={`${API_BASE_URL}${uploadedMedia[0]!.url}`}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="font-bold text-lg">
                  {formData.make} {formData.model} {formData.trim} {formData.year}
                </h3>
                <p className="text-xl font-bold text-brand-500 mt-1">
                  \u20AA{formData.priceAmount.toLocaleString()}
                </p>
                {formData.isNegotiable && (
                  <Badge variant="secondary" className="mt-1">
                    ניתן למשא ומתן
                  </Badge>
                )}
                <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                  <div>
                    <span className="text-gray-500">קילומטראז׳:</span>{' '}
                    {formData.mileage.toLocaleString()}
                  </div>
                  <div>
                    <span className="text-gray-500">יד:</span> {formData.handCount}
                  </div>
                  <div>
                    <span className="text-gray-500">דלק:</span> {formData.fuelType}
                  </div>
                  <div>
                    <span className="text-gray-500">תיבה:</span> {formData.gearbox}
                  </div>
                  <div>
                    <span className="text-gray-500">עיר:</span> {formData.city}
                  </div>
                  <div>
                    <span className="text-gray-500">תמונות:</span> {uploadedMedia.length}
                  </div>
                  <div>
                    <span className="text-gray-500">מסמכים:</span> {uploadedDocs.length}
                  </div>
                </div>
                {formData.description && (
                  <p className="mt-3 text-sm text-gray-600">{formData.description}</p>
                )}
              </div>

              <div className="bg-brand-50 rounded-lg p-4 text-sm text-brand-800">
                <p className="font-medium">לפני הפרסום:</p>
                <ul className="mt-1 space-y-1 text-brand-700">
                  <li>&#x2022; ציון האמון יחושב אוטומטית</li>
                  <li>&#x2022; המודעה תפורסם מיידית</li>
                  <li>&#x2022; ניתן לערוך גם לאחר הפרסום</li>
                </ul>
              </div>

              <Button
                className="w-full"
                size="lg"
                variant="success"
                onClick={handlePublish}
                loading={publishing}
              >
                פרסם מודעה
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1}>
              חזרה
            </Button>
            {currentStep < 7 ? (
              <Button onClick={handleNext} loading={saving}>
                {currentStep === 1 && !listingId ? 'צור טיוטה והמשך' : 'שמור והמשך'}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
