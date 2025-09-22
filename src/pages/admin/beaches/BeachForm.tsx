import React, { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { AMENITY_OPTIONS, PARKING_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS, WAVE_OPTIONS, slugify } from '@/lib/utils';
import AmenitiesMultiselect from '@/components/admin/AmenitiesMultiselect';
import { useFormDraftState } from '@/hooks/useFormDraftState';

type Beach = Tables<'beaches'>;
type BeachInsert = TablesInsert<'beaches'>;
type BeachUpdate = TablesUpdate<'beaches'> & { id: string };

const schema = z.object({
  name: z.string().min(3).max(80),
  area: z.string().min(3).max(80),
  latitude: z.coerce.number().gte(-90).lte(90),
  longitude: z.coerce.number().gte(-180).lte(180),
  description: z.string().max(1500).optional().or(z.literal('')),
  type: z.enum(['SANDY','PEBBLY','MIXED','OTHER']),
  wave_conditions: z.enum(['CALM','MODERATE','WAVY','SURFABLE']),
  organized: z.boolean().default(false),
  parking: z.enum(['NONE','ROADSIDE','SMALL_LOT','LARGE_LOT']),
  blue_flag: z.boolean().default(false),
  amenities: z.array(z.string()).default([]),
  photo_url: z.union([z.string().url(), z.literal('')]).optional(),
  photo_source: z.string().max(500).optional().or(z.literal('')),
  status: z.enum(['DRAFT','HIDDEN','ACTIVE']).default('DRAFT'),
  slug: z.string().min(3).max(120),
  source: z.string().max(500).optional().or(z.literal('')),
});

const BeachForm: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { toast } = useToast();
  const [initial, setInitial] = useState<Beach | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorSummary, setErrorSummary] = useState('');
  const firstInvalidRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const slugInputRef = useRef<HTMLInputElement | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const lastGeneratedSlugRef = useRef<string>('');

  const id = params.id as string | undefined;
  
  // Determine mode based on whether we have an ID
  const mode = id ? 'edit' : 'create';
  
  // Create a unique key for this form (edit mode uses beach ID, create mode uses 'new')
  const formKey = mode === 'edit' && id ? `edit-${id}` : 'create';
  
  // Initialize draft state - don't pass initial data here to avoid overwriting existing drafts
  const { draft, updateDraft, clearDraft, hasUnsavedChanges, hasStoredDraftData } = useFormDraftState(formKey);

  useEffect(() => {
    const load = async () => {
      if (mode === 'edit' && id) {
        const { data, error } = await supabase.from('beaches').select('*').eq('id', id).single();
        if (error) {
          setServerError(error.message);
        } else {
          setInitial(data as Beach);
          // Only update draft state with loaded data if there's no existing stored draft
          // This preserves any user changes that were already in the draft
          console.log('Loading beach data, hasStoredDraft:', hasStoredDraftData());
          if (!hasStoredDraftData()) {
            updateDraft({
              name: data.name || '',
              area: data.area || '',
              latitude: data.latitude?.toString() || '',
              longitude: data.longitude?.toString() || '',
              description: data.description || '',
              type: data.type || 'OTHER',
              wave_conditions: data.wave_conditions || 'CALM',
              organized: data.organized || false,
              parking: data.parking || 'NONE',
              blue_flag: data.blue_flag || false,
              amenities: data.amenities || [],
              photo_url: data.photo_url || '',
              photo_source: data.photo_source || '',
              status: data.status || 'DRAFT',
              slug: data.slug || '',
              source: data.source || '',
              markVerified: false,
            });
          }
        }
      } else {
        setInitial(null);
      }
    };
    load();
  }, [mode, id]);

  // Auto-generate slug from name on create, or when slug is empty and not manually edited
  useEffect(() => {
    const nameVal = nameInputRef.current?.value ?? '';
    const slugEl = slugInputRef.current;
    if (!slugEl) return;
    const currentSlug = slugEl.value;
    const generated = slugify(nameVal);
    if (mode === 'create') {
      if (!slugTouched) {
        slugEl.value = generated;
        lastGeneratedSlugRef.current = generated;
      }
    } else if (mode === 'edit') {
      // If record has no slug yet, generate one initially
      if (!currentSlug && !slugTouched) {
        slugEl.value = generated;
        lastGeneratedSlugRef.current = generated;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, mode]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty || hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, hasUnsavedChanges]);

  const ensureUniqueSlug = async (base: string, excludeId?: string): Promise<string> => {
    const candidateBase = base || 'item';
    const { data, error } = await supabase
      .from('beaches')
      .select('id, slug')
      .ilike('slug', `${candidateBase}%`);
    if (error) return candidateBase; // fallback: let DB unique constraint handle
    const taken = new Set<string>((data || []).filter(r => !excludeId || r.id !== excludeId).map(r => r.slug));
    if (!taken.has(candidateBase)) return candidateBase;
    // find first available -2..-N
    let suffix = 2;
    while (taken.has(`${candidateBase}-${suffix}`)) suffix++;
    return `${candidateBase}-${suffix}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});
    setSubmitting(true);
    // Use draft state instead of form data
    const photo_url = draft.photo_url.trim();
    // Compute slug: prefer provided, otherwise from name
    const currentSlugInput = draft.slug.trim();
    const generatedFromName = slugify(draft.name);
    let slugValue = currentSlugInput || generatedFromName;

    // Normalize legacy parking values (e.g., 'ample','limited','none') to new enum
    const parkingRaw = draft.parking;
    const parkingNorm = (() => {
      const v = parkingRaw.toUpperCase();
      if (v === 'AMPLE') return 'LARGE_LOT';
      if (v === 'LIMITED') return 'SMALL_LOT';
      if (v === 'NONE') return 'NONE';
      if (v === 'ROADSIDE') return 'ROADSIDE';
      return parkingRaw; // as-is if already correct
    })();

    // Normalize legacy status (e.g., 'INACTIVE') to new enum
    const statusRaw = draft.status.toUpperCase();
    const statusNorm = statusRaw === 'INACTIVE' ? 'HIDDEN' : statusRaw;

    const candidate = {
      name: draft.name,
      area: draft.area,
      latitude: parseFloat(draft.latitude),
      longitude: parseFloat(draft.longitude),
      description: draft.description,
      type: draft.type,
      wave_conditions: draft.wave_conditions,
      organized: draft.organized,
      parking: parkingNorm,
      blue_flag: draft.blue_flag,
      amenities: draft.amenities,
      photo_url,
      photo_source: draft.photo_source,
      status: statusNorm,
      slug: slugValue,
      source: draft.source,
    } as Record<string, unknown>;
    const parsed = schema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors: Record<string,string> = {};
      parsed.error.issues.forEach((iss)=>{
        fieldErrors[iss.path[0] as string] = iss.message;
      });
      setErrors(fieldErrors);
      const firstField = Object.keys(fieldErrors)[0];
      setErrorSummary(`Please fix: ${Object.entries(fieldErrors).map(([k,v]) => `${k}`).join(', ')}`);
      toast({ title: 'Fix form errors', description: `First invalid: ${firstField}`, variant: 'destructive' });
      // Focus and scroll to the first invalid control
      const formEl = e.currentTarget as HTMLFormElement;
      const target = formEl.querySelector(`[name="${firstField}"]`) as HTMLElement | null;
      if (target) {
        (target as HTMLInputElement).focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTimeout(()=> firstInvalidRef.current?.focus(), 0);
      }
      setSubmitting(false); // Reset submitting state on validation errors
      return;
    }

    try {
      if (mode === 'create') {
        // Ensure uniqueness before insert
        const uniqueSlug = await ensureUniqueSlug(parsed.data.slug as string);
        (parsed.data as any).slug = uniqueSlug;
        const payload: BeachInsert = parsed.data as BeachInsert;
        const { data, error } = await supabase.from('beaches').insert(payload).select().single();
        if (error || !data) throw error || new Error('Insert returned no row');
        toast({ title: 'Saved', description: 'Beach created.' });
      } else if (mode === 'edit' && id) {
        // Keep slug unique, excluding current record
        const uniqueSlug = await ensureUniqueSlug(parsed.data.slug as string, id);
        (parsed.data as any).slug = uniqueSlug;
        const payload: BeachUpdate = { 
          ...(parsed.data as BeachUpdate), 
          id,
          // Add verified_at if markVerified is true
          ...(draft.markVerified ? { verified_at: new Date().toISOString() } : {})
        };
        const { data, error } = await supabase.from('beaches').update(payload).eq('id', id).select().single();
        if (error || !data) throw error || new Error('Update matched no rows');
        toast({ title: 'Saved', description: 'Beach updated.' });
      }
      setDirty(false);
      clearDraft(); // Clear draft state after successful save
      navigate('/admin/beaches');
    } catch (err: any) {
      const msg = err?.message || 'Server error';
      if (/slug.*unique/i.test(msg)) {
        setErrors((e)=>({ ...e, slug: 'This slug already exists. Use a unique slug.' }));
        setTimeout(()=> firstInvalidRef.current?.focus(), 0);
      } else if (/Could not find the 'slug' column of 'beaches' in the schema cache/i.test(msg)) {
        // Fallback: retry without slug field to unblock saving when schema cache/column isn't ready yet
        try {
          const payloadBase = { ...(parsed.data as any) };
          delete (payloadBase as any).slug;
          if (mode === 'create') {
            const { data, error } = await supabase.from('beaches').insert(payloadBase).select().single();
            if (error || !data) throw error || new Error('Insert returned no row');
          } else if (mode === 'edit' && id) {
            const { data, error } = await supabase.from('beaches').update(payloadBase).eq('id', id).select().single();
            if (error || !data) throw error || new Error('Update matched no rows');
          }
          toast({ title: 'Saved', description: 'Saved without slug (schema not ready).', variant: 'default' });
          setDirty(false);
          clearDraft(); // Clear draft state after successful save
          navigate('/admin/beaches');
        } catch (fallbackErr: any) {
          const fbMsg = fallbackErr?.message || msg;
          setServerError(fbMsg);
          toast({ title: 'Save failed', description: fbMsg, variant: 'destructive' });
        }
      } else {
        setServerError(msg);
        toast({ title: 'Save failed', description: msg, variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const d = initial;

  if (mode === 'edit' && !d) {
    return (
      <div className="min-h-[140px] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground" aria-live="polite">Loading beach…</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" onChange={()=>setDirty(true)}>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{mode==='create' ? 'Add Beach' : 'Edit Beach'}</h1>
        {hasStoredDraftData() && (
          <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
            Draft restored
          </span>
        )}
        {(dirty || hasUnsavedChanges()) && (
          <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
            Unsaved changes
          </span>
        )}
      </div>
      {(serverError || errorSummary) && (
        <div role="alert" className="border border-destructive text-destructive rounded p-3">
          {serverError || errorSummary}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <Input 
            name="name" 
            value={draft.name} 
            onChange={(e) => {
              updateDraft({ name: e.target.value });
              if (!slugTouched && slugInputRef.current) {
                const gen = slugify(e.target.value);
                slugInputRef.current.value = gen;
                lastGeneratedSlugRef.current = gen;
              }
            }}
            aria-invalid={!!errors.name} 
            aria-describedby={errors.name ? 'name-err' : undefined} 
            ref={(el)=>{ if (errors.name) firstInvalidRef.current = el; nameInputRef.current = el; }} 
          />
          {errors.name && <p id="name-err" className="text-sm text-destructive">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Area</label>
          <Input 
            name="area" 
            value={draft.area} 
            onChange={(e) => updateDraft({ area: e.target.value })}
            aria-invalid={!!errors.area} 
            aria-describedby={errors.area ? 'area-err' : undefined} 
          />
          {errors.area && <p id="area-err" className="text-sm text-destructive">{errors.area}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Latitude</label>
          <Input 
            name="latitude" 
            value={draft.latitude} 
            onChange={(e) => updateDraft({ latitude: e.target.value })}
            aria-invalid={!!errors.latitude} 
            aria-describedby={errors.latitude ? 'lat-err' : undefined} 
            inputMode="decimal" 
          />
          {errors.latitude && <p id="lat-err" className="text-sm text-destructive">{errors.latitude}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Longitude</label>
          <Input 
            name="longitude" 
            value={draft.longitude} 
            onChange={(e) => updateDraft({ longitude: e.target.value })}
            aria-invalid={!!errors.longitude} 
            aria-describedby={errors.longitude ? 'lng-err' : undefined} 
            inputMode="decimal" 
          />
          {errors.longitude && <p id="lng-err" className="text-sm text-destructive">{errors.longitude}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Description</label>
          <Textarea 
            name="description" 
            value={draft.description} 
            onChange={(e) => updateDraft({ description: e.target.value })}
            aria-invalid={!!errors.description} 
            aria-describedby={errors.description ? 'desc-err' : undefined} 
          />
          {errors.description && <p id="desc-err" className="text-sm text-destructive">{errors.description}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select 
            name="type" 
            value={draft.type} 
            onChange={(e) => updateDraft({ type: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          >
            {TYPE_OPTIONS.map(o=> <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Wave conditions</label>
          <select 
            name="wave_conditions" 
            value={draft.wave_conditions} 
            onChange={(e) => updateDraft({ wave_conditions: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          >
            {WAVE_OPTIONS.map(o=> <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Organized</label>
          <input 
            type="checkbox" 
            name="organized" 
            checked={draft.organized} 
            onChange={(e) => updateDraft({ organized: e.target.checked })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Parking</label>
          <select 
            name="parking" 
            value={draft.parking} 
            onChange={(e) => updateDraft({ parking: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          >
            {PARKING_OPTIONS.map(o=> <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Blue flag</label>
          <input 
            type="checkbox" 
            name="blue_flag" 
            checked={draft.blue_flag} 
            onChange={(e) => updateDraft({ blue_flag: e.target.checked })}
          />
        </div>
        {mode === 'edit' && (
          <div>
            <label className="block text-sm font-medium">Verification Status</label>
            <div className="space-y-2">
              {d?.verified_at ? (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Verified:</span> {new Date(d.verified_at).toLocaleString()}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Not verified</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="mark-verified"
                  checked={draft.markVerified}
                  onChange={(e) => updateDraft({ markVerified: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="mark-verified" className="text-sm">
                  Mark as verified on save
                </label>
              </div>
            </div>
          </div>
        )}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Amenities</label>
          <AmenitiesMultiselect
            value={draft.amenities}
            onChange={(amenities) => updateDraft({ amenities })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Photo URL</label>
          <Input 
            name="photo_url" 
            value={draft.photo_url} 
            onChange={(e) => updateDraft({ photo_url: e.target.value })}
            placeholder="https://..." 
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Photo Attribution</label>
          <div className="space-y-2">
            <Input 
              name="photo_source" 
              value={draft.photo_source} 
              onChange={(e) => updateDraft({ photo_source: e.target.value })}
              placeholder="e.g., dronepicr, CC BY 2.0 <https://creativecommons.org/licenses/by/2.0>, via Wikimedia Commons" 
            />
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Quick options:</span>
              {['Unsplash', 'Pexels', 'Wikimedia Commons', 'Creative Commons', 'Public Domain', 'User submitted'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateDraft({ photo_source: option })}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border"
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Add proper attribution for the photo. Include license information and source when available.
            </p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select 
            name="status" 
            value={draft.status} 
            onChange={(e) => updateDraft({ status: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          >
            {STATUS_OPTIONS.map(o=> <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Source</label>
          <Input 
            name="source" 
            value={draft.source} 
            onChange={(e) => updateDraft({ source: e.target.value })}
            placeholder="e.g., OpenStreetMap, Google Maps, User submission" 
          />
          <p className="text-xs text-muted-foreground mt-1">Optional: Where this beach data came from.</p>
        </div>
        <div className="md:col-span-2">
          <details>
            <summary className="cursor-pointer select-none text-sm font-medium">Advanced</summary>
            <div className="mt-2">
              <label className="block text-sm font-medium">Slug</label>
              <Input 
                name="slug" 
                value={draft.slug} 
                onChange={(e) => {
                  updateDraft({ slug: e.target.value });
                  setSlugTouched(true);
                }}
                aria-invalid={!!errors.slug} 
                aria-describedby={errors.slug ? 'slug-err' : undefined}
                ref={slugInputRef}
              />
              {errors.slug && <p id="slug-err" className="text-sm text-destructive">{errors.slug}</p>}
              <p className="text-xs text-muted-foreground mt-1">Leave empty to auto-generate from name. Must be unique.</p>
            </div>
          </details>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
        <Button type="button" variant="outline" onClick={()=>navigate('/admin/beaches')} disabled={submitting}>Cancel</Button>
        {hasStoredDraftData() && (
          <Button type="button" variant="outline" onClick={clearDraft} disabled={submitting} className="text-red-600 border-red-200 hover:bg-red-50">
            Clear Draft
          </Button>
        )}
        {mode==='create' && (
          <Button type="button" variant="secondary" disabled={submitting} onClick={async()=>{
            updateDraft({ status: 'ACTIVE' });
            // Trigger form submission after updating draft
            setTimeout(() => {
              const form = document.querySelector('form') as HTMLFormElement;
              form.requestSubmit();
            }, 0);
          }}>Save & set ACTIVE</Button>
        )}
      </div>
    </form>
  );
};

export default BeachForm;


