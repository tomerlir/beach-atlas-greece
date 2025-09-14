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

type Beach = Tables<'beaches'>;
type BeachInsert = TablesInsert<'beaches'>;
type BeachUpdate = TablesUpdate<'beaches'> & { id: string };

const schema = z.object({
  name: z.string().min(3).max(80),
  place_text: z.string().min(3).max(80),
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
  status: z.enum(['DRAFT','HIDDEN','ACTIVE']).default('DRAFT'),
  slug: z.string().min(3).max(120),
});

interface Props { mode: 'create' | 'edit' }

const BeachForm: React.FC<Props> = ({ mode }) => {
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

  useEffect(() => {
    const load = async () => {
      if (mode === 'edit' && id) {
        const { data, error } = await supabase.from('beaches').select('*').eq('id', id).single();
        if (error) {
          setServerError(error.message);
        } else {
          setInitial(data as Beach);
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
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

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
    const form = new FormData(e.currentTarget);
    const values = Object.fromEntries(form.entries());
    const amenities = (values.amenities as string | undefined)?.split(',').map(s=>s.trim()).filter(Boolean) || [];
    const photo_url = String(values.photo_url || '').trim();
    // Compute slug: prefer provided, otherwise from name
    const currentSlugInput = (values.slug as string | undefined)?.trim() || '';
    const generatedFromName = slugify(String(values.name || ''));
    let slugValue = currentSlugInput || generatedFromName;

    // Normalize legacy parking values (e.g., 'ample','limited','none') to new enum
    const parkingRaw = String(values.parking || '');
    const parkingNorm = (() => {
      const v = parkingRaw.toUpperCase();
      if (v === 'AMPLE') return 'LARGE_LOT';
      if (v === 'LIMITED') return 'SMALL_LOT';
      if (v === 'NONE') return 'NONE';
      if (v === 'ROADSIDE') return 'ROADSIDE';
      return parkingRaw; // as-is if already correct
    })();

    // Normalize legacy status (e.g., 'INACTIVE') to new enum
    const statusRaw = String(values.status || 'DRAFT').toUpperCase();
    const statusNorm = statusRaw === 'INACTIVE' ? 'HIDDEN' : statusRaw;

    const candidate = {
      name: String(values.name || ''),
      place_text: String(values.place_text || ''),
      latitude: values.latitude,
      longitude: values.longitude,
      description: String(values.description || ''),
      type: values.type,
      wave_conditions: values.wave_conditions,
      organized: values.organized === 'on',
      parking: parkingNorm,
      blue_flag: values.blue_flag === 'on',
      amenities,
      photo_url,
      status: statusNorm,
      slug: slugValue,
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
        const payload: BeachUpdate = { ...(parsed.data as BeachUpdate), id };
        const { data, error } = await supabase.from('beaches').update(payload).eq('id', id).select().single();
        if (error || !data) throw error || new Error('Update matched no rows');
        toast({ title: 'Saved', description: 'Beach updated.' });
      }
      setDirty(false);
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
      <h1 className="text-2xl font-semibold text-foreground">{mode==='create' ? 'Add Beach' : 'Edit Beach'}</h1>
      {(serverError || errorSummary) && (
        <div role="alert" className="border border-destructive text-destructive rounded p-3">
          {serverError || errorSummary}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <Input name="name" defaultValue={d?.name} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-err' : undefined} ref={(el)=>{ if (errors.name) firstInvalidRef.current = el; nameInputRef.current = el; }} onChange={(e)=>{
            if (!slugTouched && slugInputRef.current) {
              const gen = slugify(e.target.value);
              slugInputRef.current.value = gen;
              lastGeneratedSlugRef.current = gen;
            }
          }} />
          {errors.name && <p id="name-err" className="text-sm text-destructive">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Place</label>
          <Input name="place_text" defaultValue={d?.place_text} aria-invalid={!!errors.place_text} aria-describedby={errors.place_text ? 'place-err' : undefined} />
          {errors.place_text && <p id="place-err" className="text-sm text-destructive">{errors.place_text}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Latitude</label>
          <Input name="latitude" defaultValue={d?.latitude} aria-invalid={!!errors.latitude} aria-describedby={errors.latitude ? 'lat-err' : undefined} inputMode="decimal" />
          {errors.latitude && <p id="lat-err" className="text-sm text-destructive">{errors.latitude}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Longitude</label>
          <Input name="longitude" defaultValue={d?.longitude} aria-invalid={!!errors.longitude} aria-describedby={errors.longitude ? 'lng-err' : undefined} inputMode="decimal" />
          {errors.longitude && <p id="lng-err" className="text-sm text-destructive">{errors.longitude}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Description</label>
          <Textarea name="description" defaultValue={d?.description ?? ''} aria-invalid={!!errors.description} aria-describedby={errors.description ? 'desc-err' : undefined} />
          {errors.description && <p id="desc-err" className="text-sm text-destructive">{errors.description}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select name="type" defaultValue={d?.type ?? 'OTHER'} className="border rounded px-2 py-1 w-full">
            {TYPE_OPTIONS.map(o=> <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Wave conditions</label>
          <select name="wave_conditions" defaultValue={d?.wave_conditions ?? 'CALM'} className="border rounded px-2 py-1 w-full">
            {WAVE_OPTIONS.map(o=> <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Organized</label>
          <input type="checkbox" name="organized" defaultChecked={d?.organized} />
        </div>
        <div>
          <label className="block text-sm font-medium">Parking</label>
          <select name="parking" defaultValue={(d?.parking ? d.parking.toUpperCase() : 'NONE').replace('AMPLE','LARGE_LOT').replace('LIMITED','SMALL_LOT')} className="border rounded px-2 py-1 w-full">
            {PARKING_OPTIONS.map(o=> <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Blue flag</label>
          <input type="checkbox" name="blue_flag" defaultChecked={d?.blue_flag} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Amenities (comma separated)</label>
          <Input name="amenities" defaultValue={d?.amenities?.join(', ') ?? ''} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Photo URL</label>
          <Input name="photo_url" defaultValue={d?.photo_url ?? ''} placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select name="status" defaultValue={d?.status ?? 'DRAFT'} className="border rounded px-2 py-1 w-full">
            {STATUS_OPTIONS.map(o=> <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {/* Source removed for MVP */}
        <div className="md:col-span-2">
          <details>
            <summary className="cursor-pointer select-none text-sm font-medium">Advanced</summary>
            <div className="mt-2">
              <label className="block text-sm font-medium">Slug</label>
              <Input 
                name="slug" 
                defaultValue={d?.slug ?? ''} 
                aria-invalid={!!errors.slug} 
                aria-describedby={errors.slug ? 'slug-err' : undefined}
                ref={slugInputRef}
                onChange={()=> setSlugTouched(true)}
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
        {mode==='create' && (
          <Button type="button" variant="secondary" disabled={submitting} onClick={async()=>{
            const form = document.querySelector('form') as HTMLFormElement;
            const statusInput = form.querySelector('select[name="status"]') as HTMLSelectElement | null;
            if (statusInput) statusInput.value = 'ACTIVE';
            form.requestSubmit();
          }}>Save & set ACTIVE</Button>
        )}
      </div>
    </form>
  );
};

export default BeachForm;


