
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { User } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  
  const handleUpdateProfile = () => {
    // In a real app, this would update the user profile in Supabase
    // For now, we'll just show a success message
    toast.success('Profile updated successfully!');
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-gray-500">Manage your account settings</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                />
                <p className="text-xs text-gray-500">Your email address cannot be changed</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-type">User Type</Label>
                <Input
                  id="user-type"
                  value={user?.user_type || ''}
                  disabled
                />
              </div>
              
              <Button type="button" onClick={handleUpdateProfile}>
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6">
              <div className="bg-gray-100 rounded-full p-8">
                <User className="h-20 w-20 text-gray-500" />
              </div>
            </div>
            
            <p className="text-center text-sm text-gray-500">
              In a real implementation, you would be able to upload a profile picture here.
            </p>
            
            <div className="pt-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={logout}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          This is a demo app. In a real implementation, this would connect to Supabase for user profile management.
        </p>
      </div>
    </div>
  );
};

export default Profile;
