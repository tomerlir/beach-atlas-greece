import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
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
        const uniqueLocations = new Set(allBeaches?.map(b => b.place_text)).size;
        
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage the Greek beaches directory and user accounts
          </p>
        </div>
        <Link to="/admin/beaches/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Beach
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="beaches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="beaches" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Beaches
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="beaches" className="space-y-6">

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Beaches</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Active beaches in directory
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Organized</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.organized}</div>
            <p className="text-xs text-muted-foreground">
              With facilities
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Blue Flag</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.blueFlag}</div>
            <p className="text-xs text-muted-foreground">
              Certified beaches
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.locations}</div>
            <p className="text-xs text-muted-foreground">
              Islands & regions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest changes to the beaches directory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-muted rounded-full mr-3 animate-pulse" />
                <div className="text-sm text-muted-foreground">Loading recent activity...</div>
              </div>
            </div>
          ) : beaches.length === 0 ? (
            <div className="text-sm text-muted-foreground">No recent activity</div>
          ) : (
            <div className="space-y-4">
              {beaches.map((beach) => (
                <div key={beach.id} className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                  <div className="text-sm">
                    <Link 
                      to={`/admin/beaches/${beach.id}`}
                      className="font-medium hover:underline"
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

        <TabsContent value="users">
          <AdminUserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;