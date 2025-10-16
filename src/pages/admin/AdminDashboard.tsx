import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authSupabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { formatRelativeUpdatedAt } from '@/lib/utils';
import { AdminUserManagement } from '@/components/admin/AdminUserManagement';

type Beach = Tables<'beaches'>;

const AdminDashboard = () => {
  const [beaches, setBeaches] = useState<Beach[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    organized: 0,
    blueFlag: 0,
    locations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all beaches for stats
        const { data: allBeaches, error: beachesError } = await supabase
          .from('beaches')
          .select('*');
        
        if (beachesError) throw beachesError;

        // Fetch recent updates (last 5 beaches updated)
        const { data: recentBeaches, error: recentError } = await supabase
          .from('beaches')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(5);

        if (recentError) throw recentError;

        setBeaches(recentBeaches || []);
        
        // Calculate stats
        const total = allBeaches?.length || 0;
        const organized = allBeaches?.filter(b => b.organized).length || 0;
        const blueFlag = allBeaches?.filter(b => b.blue_flag).length || 0;
        const uniqueLocations = new Set(allBeaches?.map(b => b.area)).size;
        
        setStats({
          total,
          organized,
          blueFlag,
          locations: uniqueLocations
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage the Greek beaches directory and user accounts
          </p>
        </div>
        <Link to="/admin/beaches/new">
          <Button size="lg" className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Beach
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="beaches" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="beaches" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Beaches
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="beaches" className="space-y-6 animate-in fade-in-50 duration-300">

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Beaches</CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active beaches in directory
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Organized</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : stats.organized}</div>
            <p className="text-xs text-muted-foreground mt-1">
              With facilities
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Blue Flag</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : stats.blueFlag}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Certified beaches
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : stats.locations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Islands & regions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest changes to the beaches directory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-2 h-2 bg-muted rounded-full" />
                  <div className="flex-1 h-4 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : beaches.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">No recent activity</div>
            </div>
          ) : (
            <div className="space-y-3">
              {beaches.map((beach) => (
                <div key={beach.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                  <div className="text-sm min-w-0 flex-1">
                    <Link 
                      to={`/admin/beaches/${beach.id}`}
                      className="font-medium hover:underline text-foreground hover:text-primary transition-colors"
                    >
                      {beach.name}
                    </Link>
                    <span className="text-muted-foreground ml-1">
                      was updated {formatRelativeUpdatedAt(beach.updated_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="users" className="animate-in fade-in-50 duration-300">
          <AdminUserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;