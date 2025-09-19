import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Simple test component to verify the settings route is working
const AdminSettingsTest: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings Test</h1>
        <p className="text-muted-foreground mt-1">
          This is a test to verify the settings route is working
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p>If you can see this, the /admin/settings route is working correctly!</p>
          <p className="text-sm text-muted-foreground mt-2">
            Current time: {new Date().toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsTest;
