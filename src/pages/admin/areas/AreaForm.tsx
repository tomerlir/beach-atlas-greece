import React, { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { authSupabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { slugify } from '@/lib/utils';
import { useAreaFormDraftState } from '@/hooks/useAreaFormDraftState';

type Area = Tables<'areas'>;
type AreaInsert = TablesInsert<'areas'>;
type AreaUpdate = TablesUpdate<'areas'> & { id: string };

const schema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500).optional().or(z.literal('')),
  hero_photo_url: z.union([z.string().url(), z.literal('')]).optional(),
  hero_photo_source: z.string().max(500).optional().or(z.literal('')),
  status: z.enum(['DRAFT','HIDDEN','ACTIVE']).default('DRAFT'),
});

const AreaForm: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { toast } = useToast();
  const [initial, setInitial] = useState<Area | null>(null);
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
  
  const mode = id ? 'edit' : 'create';
  const formKey = mode === 'edit' && id ? `edit-area-${id}` : 'create-area';
  
  const { draft, updateDraft, clearDraft, hasUnsavedChanges, hasStoredDraftData } = useAreaFormDraftState(formKey);

  useEffect(() => {
    const load = async () => {
      if (mode === 'edit' && id) {
        const { data, error } = await authSupabase.from('areas').select('*').eq('id', id).single();
        if (error) {
          setServerError(error.message);
        } else {
          setInitial(data as Area);
          if (!hasStoredDraftData()) {
            updateDraft({
              name: data.name || '',
              slug: data.slug || '',
              description: data.description || '',
              hero_photo_url: data.hero_photo_url || '',
              hero_photo_source: data.hero_photo_source || '',
              status: data.status || 'DRAFT',
            });
          }
        }
      } else {
        setInitial(null);
      }
    };
    load();
  }, [mode, id, hasStoredDraftData, updateDraft]);

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
        updateDraft({ slug: generated });
      }
    } else if (mode === 'edit') {
      if (!currentSlug && !slugTouched) {
        slugEl.value = generated;
        lastGeneratedSlugRef.current = generated;
        updateDraft({ slug: generated });
      }
    }
  }, [initial, mode, slugTouched, updateDraft]);

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
    const candidateBase = base || 'area';
    const { data, error } = await supabase
      .from('areas')
      .select('id, slug')
      .ilike('slug', `${candidateBase}%`);
    if (error) return candidateBase;
    const taken = new Set<string>((data || []).filter(r => !excludeId || r.id !== excludeId).map(r => r.slug));
    if (!taken.has(candidateBase)) return candidateBase;
    let suffix = 2;
    while (taken.has(`${candidateBase}-${suffix}`)) suffix++;
    return `${candidateBase}-${suffix}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});
    setSubmitting(true);
    
    const currentSlugInput = draft.slug.trim();
    const generatedFromName = slugify(draft.name);
    const slugValue = currentSlugInput || generatedFromName;

    const candidate = {
      name: draft.name,
      slug: slugValue,
      description: draft.description,
      hero_photo_url: draft.hero_photo_url?.trim() || null,
      hero_photo_source: draft.hero_photo_source,
      status: draft.status,
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
      const formEl = e.currentTarget as HTMLFormElement;
      const target = formEl.querySelector(`[name="${firstField}"]`) as HTMLElement | null;
      if (target) {
        (target as HTMLInputElement).focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTimeout(()=> firstInvalidRef.current?.focus(), 0);
      }
      setSubmitting(false);
      return;
    }

    try {
      if (mode === 'create') {
        const uniqueSlug = await ensureUniqueSlug(parsed.data.slug as string);
        (parsed.data as any).slug = uniqueSlug;
        const payload: AreaInsert = parsed.data as AreaInsert;
        const { data, error } = await authSupabase.from('areas').insert(payload).select().maybeSingle();
        if (error || !data) throw error || new Error('Insert returned no row');
        toast({ title: 'Saved', description: 'Area created.' });
      } else if (mode === 'edit' && id) {
        const uniqueSlug = await ensureUniqueSlug(parsed.data.slug as string, id);
        (parsed.data as any).slug = uniqueSlug;
        const payload: AreaUpdate = { 
          ...(parsed.data as AreaUpdate), 
          id,
        };
        const { data, error } = await authSupabase.from('areas').update(payload).eq('id', id).select().maybeSingle();
        if (error || !data) throw error || new Error('Update matched no rows');
        toast({ title: 'Saved', description: 'Area updated.' });
      }
      setDirty(false);
      clearDraft();
      navigate('/admin/areas');
    } catch (err: any) {
      const msg = err?.message || 'Server error';
      if (/slug.*unique/i.test(msg)) {
        setErrors((e)=>({ ...e, slug: 'This slug already exists. Use a unique slug.' }));
        setTimeout(()=> firstInvalidRef.current?.focus(), 0);
      } else {
        setServerError(msg);
        toast({ title: 'Save failed', description: msg, variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'edit' && !initial) {
    return (
      <div className="min-h-[140px] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground" aria-live="polite">Loading area…</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" onChange={()=>setDirty(true)}>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{mode==='create' ? 'Add Area' : 'Edit Area'}</h1>
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
                updateDraft({ slug: gen });
              }
            }}
            aria-invalid={!!errors.name} 
            aria-describedby={errors.name ? 'name-err' : undefined} 
            ref={(el)=>{ if (errors.name) firstInvalidRef.current = el; nameInputRef.current = el; }} 
          />
          {errors.name && <p id="name-err" className="text-sm text-destructive">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Slug</label>
          <Input 
            name="slug" 
            value={draft.slug} 
            onChange={(e) => {
              setSlugTouched(true);
              updateDraft({ slug: e.target.value });
            }}
            aria-invalid={!!errors.slug} 
            aria-describedby={errors.slug ? 'slug-err' : undefined} 
            ref={(el)=>{ if (errors.slug) firstInvalidRef.current = el; slugInputRef.current = el; }} 
            placeholder="auto-generated from name"
          />
          {errors.slug && <p id="slug-err" className="text-sm text-destructive">{errors.slug}</p>}
          <p className="text-xs text-muted-foreground mt-1">URL-friendly version of the name. Only lowercase letters, numbers, and hyphens.</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Description</label>
          <Textarea 
            name="description" 
            value={draft.description} 
            onChange={(e) => updateDraft({ description: e.target.value })}
            aria-invalid={!!errors.description} 
            aria-describedby={errors.description ? 'desc-err' : undefined} 
            rows={3}
            placeholder="Short description of the area"
          />
          {errors.description && <p id="desc-err" className="text-sm text-destructive">{errors.description}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Hero Photo URL</label>
          <Input 
            name="hero_photo_url" 
            value={draft.hero_photo_url} 
            onChange={(e) => updateDraft({ hero_photo_url: e.target.value })}
            aria-invalid={!!errors.hero_photo_url} 
            aria-describedby={errors.hero_photo_url ? 'hero-err' : undefined} 
            placeholder="https://example.com/photo.jpg"
          />
          {errors.hero_photo_url && <p id="hero-err" className="text-sm text-destructive">{errors.hero_photo_url}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Hero Photo Source</label>
          <Input 
            name="hero_photo_source" 
            value={draft.hero_photo_source} 
            onChange={(e) => updateDraft({ hero_photo_source: e.target.value })}
            placeholder="Photo credit/source"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select 
            name="status" 
            value={draft.status} 
            onChange={(e) => updateDraft({ status: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          >
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
            <option value="ACTIVE">Active</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : (mode === 'create' ? 'Create Area' : 'Update Area')}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/admin/areas')}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default AreaForm;