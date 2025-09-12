import React from 'react';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Beach Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage the Greek beaches directory
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Beach
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Beaches</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
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
            <div className="text-2xl font-bold">8</div>
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
            <div className="text-2xl font-bold">5</div>
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
            <div className="text-2xl font-bold">6</div>
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
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-3" />
              <div className="text-sm">
                <span className="font-medium">Navagio Beach</span> was updated
                <span className="text-muted-foreground ml-1">2 hours ago</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
              <div className="text-sm">
                <span className="font-medium">Elafonissi Beach</span> was added
                <span className="text-muted-foreground ml-1">1 day ago</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
              <div className="text-sm">
                <span className="font-medium">Balos Lagoon</span> photos updated
                <span className="text-muted-foreground ml-1">3 days ago</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;