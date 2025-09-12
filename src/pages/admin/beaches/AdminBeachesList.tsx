import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { AMENITY_OPTIONS, PARKING_OPTIONS, STATUS_OPTIONS, formatRelativeUpdatedAt } from '@/lib/utils';

type Beach = Tables<'beaches'>;

type SortKey = 'updated_at' | 'name' | 'status';

const PAGE_SIZE = 20;

const AdminBeachesList: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Beach[]>([]);
  const [total, setTotal] = useState(0);
  const [liveMsg, setLiveMsg] = useState('');
  const liveRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLButtonElement | null>(null);

  const page = Number(searchParams.get('page') || '1');
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status') || 'ALL';
  const organized = searchParams.get('organized') || 'ALL';
  const sort = (searchParams.get('sort') as SortKey) || 'updated_at';
  const dir = (searchParams.get('dir') as 'asc' | 'desc') || (sort === 'updated_at' ? 'desc' : 'asc');

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'ALL') next.delete(key); else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const fetchBeaches = async () => {
    setLoading(true);
    try {
      let query = supabase.from('beaches').select('*', { count: 'exact' });
      if (q) {
        // OR across name/place_text
        query = query.or(`name.ilike.%${q}%,place_text.ilike.%${q}%`);
      }
      if (status && status !== 'ALL') {
        query = query.eq('status', status as 'ACTIVE' | 'HIDDEN' | 'DRAFT');
      }
      if (organized !== 'ALL') {
        query = query.eq('organized', organized === 'YES');
      }
      query = query.order(sort, { ascending: dir === 'asc' });
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, count, error } = await query.range(from, to);
      if (error) throw error;
      setItems(data || []);
      setTotal(count || 0);
      setLiveMsg(`Loaded ${data?.length || 0} beaches. Page ${page} of ${Math.max(1, Math.ceil((count||0)/PAGE_SIZE))}.`);
    } catch (err: any) {
      toast({ title: 'Error loading beaches', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeaches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, organized, sort, dir, page]);

  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.textContent = liveMsg;
    }
  }, [liveMsg]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`Delete beach "${name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('beaches').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: `${name} removed.` });
      await fetchBeaches();
      setTimeout(() => lastFocusedRef.current?.focus(), 0);
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  const renderStatus = (s: Beach['status']) => {
    const color = s === 'ACTIVE' ? 'bg-green-100 text-green-800' : s === 'HIDDEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800';
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{s}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="sr-only" aria-live="polite" ref={liveRef} />
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Link to="/admin/beaches/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Beach
            </Button>
          </Link>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Search beaches"
              className="pl-8 w-64"
              value={q}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder="Search name or place"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select aria-label="Filter status" className="border rounded px-2 py-1" value={status} onChange={(e)=>setParam('status', e.target.value)}>
            <option value="ALL">All status</option>
            {['ACTIVE','DRAFT','HIDDEN'].map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          <select aria-label="Filter organized" className="border rounded px-2 py-1" value={organized} onChange={(e)=>setParam('organized', e.target.value)}>
            <option value="ALL">All</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
          <select aria-label="Sort by" className="border rounded px-2 py-1" value={`${sort}:${dir}`} onChange={(e)=>{
            const [s, d] = e.target.value.split(':') as [SortKey, 'asc'|'desc'];
            setParam('sort', s);
            setParam('dir', d);
          }}>
            <option value="updated_at:desc">Updated (newest)</option>
            <option value="updated_at:asc">Updated (oldest)</option>
            <option value="name:asc">Name (A–Z)</option>
            <option value="name:desc">Name (Z–A)</option>
            <option value="status:asc">Status (A–Z)</option>
            <option value="status:desc">Status (Z–A)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Beaches management list</caption>
          <thead>
            <tr className="text-left border-b">
              <th scope="col" className="py-2 pr-2">Name</th>
              <th scope="col" className="py-2 pr-2">Place</th>
              <th scope="col" className="py-2 pr-2">Organized</th>
              <th scope="col" className="py-2 pr-2">Parking</th>
              <th scope="col" className="py-2 pr-2">Blue Flag</th>
              <th scope="col" className="py-2 pr-2">Status</th>
              <th scope="col" className="py-2 pr-2">Updated</th>
              <th scope="col" className="py-2 pr-2"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id} className="border-b last:border-0 align-top">
                <td className="py-2 pr-2 font-medium text-foreground">
                  <Link to={`/admin/beaches/${b.id}`} className="underline underline-offset-2">{b.name}</Link>
                </td>
                <td className="py-2 pr-2">{b.place_text}</td>
                <td className="py-2 pr-2">{b.organized ? 'Yes' : 'No'}</td>
                <td className="py-2 pr-2">{b.parking}</td>
                <td className="py-2 pr-2">{b.blue_flag ? <Badge>Blue Flag</Badge> : '-'}</td>
                <td className="py-2 pr-2">{renderStatus(b.status)}</td>
                <td className="py-2 pr-2 whitespace-nowrap">{formatRelativeUpdatedAt(b.updated_at)}</td>
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/beaches/${b.id}`}>
                      <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-1"/>Edit</Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={(e)=>{ lastFocusedRef.current = e.currentTarget; onDelete(b.id, b.name);} }>
                      <Trash2 className="h-4 w-4 mr-1"/>Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-muted-foreground">No results</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <nav className="flex items-center justify-between" aria-label="Pagination">
        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`px-3 py-1 rounded border ${p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => setParam('page', String(p))}
            >
              {p}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {items.map((b) => (
          <Card key={b.id} className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold"><Link to={`/admin/beaches/${b.id}`} className="underline underline-offset-2">{b.name}</Link></h3>
                <p className="text-sm text-muted-foreground">{b.place_text}</p>
              </div>
              {renderStatus(b.status)}
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Organized</dt>
                <dd>{b.organized ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Parking</dt>
                <dd>{b.parking}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Blue Flag</dt>
                <dd>{b.blue_flag ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Updated</dt>
                <dd>{formatRelativeUpdatedAt(b.updated_at)}</dd>
              </div>
            </dl>
            <div className="mt-3 flex gap-2">
              <Link to={`/admin/beaches/${b.id}`} className="w-full"><Button variant="outline" className="w-full">Edit</Button></Link>
              <Button variant="destructive" className="w-full" onClick={(e)=>{ lastFocusedRef.current = e.currentTarget; onDelete(b.id, b.name);} }>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminBeachesList;


