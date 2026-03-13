'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Input, Badge } from '@zuzz/ui';
import { api } from '@/lib/api';

const STEPS = [
  { step: 1, label: 'זיהוי רכב' },
  { step: 2, label: 'פרטי הרכב' },
  { step: 3, label: 'הצהרות מוכר' },
  { step: 4, label: 'תמחור' },
  { step: 5, label: 'תמונות' },
  { step: 6, label: 'מסמכים' },
  { step: 7, label: 'תצוגה מקדימה' },
];

export default function CreateCarPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [listingId, setListingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    licensePlate: '', make: '', model: '', trim: '', year: new Date().getFullYear(),
    mileage: 0, handCount: 0, ownershipType: 'private', gearbox: 'automatic', fuelType: 'petrol',
    engineVolume: 0, horsepower: 0, seats: 5, color: '', bodyType: 'sedan', testUntil: '',
    accidentDeclared: false, accidentDetails: '', engineReplaced: false, gearboxReplaced: false,
    frameDamage: false, maintenanceHistory: '', numKeys: 2, warrantyExists: false, warrantyDetails: '',
    recallStatus: 'none', personalImport: false,
    priceAmount: 0, isNegotiable: false, city: '', region: '',
    isElectric: false, batteryCapacity: 0, rangeKm: 0,
  });

  const update = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleCreateDraft = async () => {
    try {
      const res = await api.post<{ data: { id: string } }>('/api/cars', {});
      setListingId(res.data.id);
    } catch (e) {
      console.error('Failed to create draft', e);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !listingId) {
      handleCreateDraft().then(() => setCurrentStep(2));
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 7));
    }
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">פרסום רכב למכירה</h1>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map(s => (
          <button
            key={s.step}
            onClick={() => s.step <= currentStep && setCurrentStep(s.step)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              s.step === currentStep ? 'bg-blue-600 text-white' :
              s.step < currentStep ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white/20">
              {s.step < currentStep ? '✓' : s.step}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Step 1: Identify */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">זיהוי הרכב</h2>
              <p className="text-sm text-gray-500">הזן מספר רישוי, VIN, או בחר ידנית</p>
              <Input label="מספר רישוי" placeholder="12-345-67" value={formData.licensePlate}
                onChange={e => update('licensePlate', e.target.value)} />
              <div className="text-center text-sm text-gray-400">או</div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="יצרן" placeholder="Toyota" value={formData.make} onChange={e => update('make', e.target.value)} />
                <Input label="דגם" placeholder="Corolla" value={formData.model} onChange={e => update('model', e.target.value)} />
              </div>
              <Input label="שנה" type="number" value={String(formData.year)} onChange={e => update('year', Number(e.target.value))} />
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">פרטי הרכב</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="יצרן" value={formData.make} onChange={e => update('make', e.target.value)} />
                <Input label="דגם" value={formData.model} onChange={e => update('model', e.target.value)} />
                <Input label="גרסה" value={formData.trim} onChange={e => update('trim', e.target.value)} />
                <Input label="שנה" type="number" value={String(formData.year)} onChange={e => update('year', Number(e.target.value))} />
                <Input label='קילומטראז׳' type="number" value={String(formData.mileage)} onChange={e => update('mileage', Number(e.target.value))} />
                <Input label="יד" type="number" value={String(formData.handCount)} onChange={e => update('handCount', Number(e.target.value))} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תיבת הילוכים</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={formData.gearbox} onChange={e => update('gearbox', e.target.value)}>
                    <option value="automatic">אוטומטית</option>
                    <option value="manual">ידנית</option>
                    <option value="robotic">רובוטית</option>
                    <option value="cvt">CVT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סוג דלק</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={formData.fuelType} onChange={e => update('fuelType', e.target.value)}>
                    <option value="petrol">בנזין</option>
                    <option value="diesel">דיזל</option>
                    <option value="hybrid">היברידי</option>
                    <option value="phev">PHEV</option>
                    <option value="electric">חשמלי</option>
                    <option value="lpg">גז</option>
                  </select>
                </div>
                <Input label="נפח מנוע (סמ״ק)" type="number" value={String(formData.engineVolume)} onChange={e => update('engineVolume', Number(e.target.value))} />
                <Input label="כוח סוס" type="number" value={String(formData.horsepower)} onChange={e => update('horsepower', Number(e.target.value))} />
                <Input label="צבע" value={formData.color} onChange={e => update('color', e.target.value)} />
                <Input label="טסט עד" type="date" value={formData.testUntil} onChange={e => update('testUntil', e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 3: Statements */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">הצהרות מוכר</h2>
              <p className="text-sm text-gray-500">נא לענות בכנות — הצהרות אלו משפיעות על ציון האמון</p>
              <Checkbox label="האם היו תאונות?" checked={formData.accidentDeclared} onChange={v => update('accidentDeclared', v)} />
              {formData.accidentDeclared && (
                <Input label="פרטי התאונה" value={formData.accidentDetails} onChange={e => update('accidentDetails', e.target.value)} />
              )}
              <Checkbox label="מנוע הוחלף?" checked={formData.engineReplaced} onChange={v => update('engineReplaced', v)} />
              <Checkbox label="תיבת הילוכים הוחלפה?" checked={formData.gearboxReplaced} onChange={v => update('gearboxReplaced', v)} />
              <Checkbox label="נזק לשלדה?" checked={formData.frameDamage} onChange={v => update('frameDamage', v)} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">היסטוריית טיפולים</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={formData.maintenanceHistory} onChange={e => update('maintenanceHistory', e.target.value)}>
                  <option value="">בחר</option>
                  <option value="full_agency">שירות מלא בסוכנות</option>
                  <option value="partial_agency">חלקי בסוכנות</option>
                  <option value="independent">מוסך עצמאי</option>
                  <option value="none">אין היסטוריה</option>
                </select>
              </div>
              <Input label="מספר מפתחות" type="number" value={String(formData.numKeys)} onChange={e => update('numKeys', Number(e.target.value))} />
              <Checkbox label="אחריות בתוקף?" checked={formData.warrantyExists} onChange={v => update('warrantyExists', v)} />
              {formData.warrantyExists && (
                <Input label="פרטי אחריות" value={formData.warrantyDetails} onChange={e => update('warrantyDetails', e.target.value)} />
              )}
              <Checkbox label="יבוא אישי?" checked={formData.personalImport} onChange={v => update('personalImport', v)} />
            </div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">תמחור</h2>
              <Input label="מחיר (₪)" type="number" value={String(formData.priceAmount)} onChange={e => update('priceAmount', Number(e.target.value))} />
              <Checkbox label="ניתן למשא ומתן" checked={formData.isNegotiable} onChange={v => update('isNegotiable', v)} />
              <Input label="עיר" placeholder="תל אביב-יפו" value={formData.city} onChange={e => update('city', e.target.value)} />
            </div>
          )}

          {/* Step 5: Photos */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">תמונות</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-gray-500 mb-2">גרור תמונות לכאן או לחץ להעלאה</p>
                <p className="text-xs text-gray-400">עד 20 תמונות, JPG/PNG, עד 10MB כל אחת</p>
                <Button variant="outline" className="mt-4">בחר תמונות</Button>
              </div>
            </div>
          )}

          {/* Step 6: Documents */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">מסמכים</h2>
              <p className="text-sm text-gray-500">העלאת מסמכים מעלה את ציון האמון של המודעה</p>
              <div className="space-y-3">
                {['רישיון רכב', 'תעודת טסט', 'ביטוח', 'דו״ח בדיקה'].map((docType, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{docType}</span>
                    <Button variant="outline" size="sm">העלה</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Preview */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">תצוגה מקדימה</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-lg">{formData.make} {formData.model} {formData.trim} {formData.year}</h3>
                <p className="text-xl font-bold text-blue-600 mt-1">₪{formData.priceAmount.toLocaleString()}</p>
                <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                  <div><span className="text-gray-500">קילומטראז׳:</span> {formData.mileage.toLocaleString()}</div>
                  <div><span className="text-gray-500">יד:</span> {formData.handCount}</div>
                  <div><span className="text-gray-500">דלק:</span> {formData.fuelType}</div>
                  <div><span className="text-gray-500">תיבה:</span> {formData.gearbox}</div>
                  <div><span className="text-gray-500">עיר:</span> {formData.city}</div>
                </div>
              </div>
              <Button className="w-full" size="lg" variant="success">פרסם מודעה</Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t">
            <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1}>חזרה</Button>
            {currentStep < 7 ? (
              <Button onClick={handleNext}>המשך</Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
