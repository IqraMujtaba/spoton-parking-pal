
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  user_role: string;
  created_at: string;
}

const UserManagement = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [updatingRole, setUpdatingRole] = useState(false);
  
  // Redirect non-admin users
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('email');
        
        if (error) throw error;
        setUsers(data || []);
        setFilteredUsers(data || []);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };
    
    loadUsers();
  }, []);
  
  // Filter users
  useEffect(() => {
    let filtered = users;
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(query) || 
        user.first_name?.toLowerCase().includes(query) || 
        user.last_name?.toLowerCase().includes(query)
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.user_role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter]);
  
  // Handle role update
  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      setUpdatingRole(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ user_role: newRole })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, user_role: newRole } : user
      ));
      
      toast.success(`Role updated for ${selectedUser.email}`);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    } finally {
      setUpdatingRole(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-gray-500">View and manage system users</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user roles and accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="Search by email or name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <Select
                  value={roleFilter}
                  onValueChange={setRoleFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="visitor">Visitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Users table */}
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Role</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="py-2">{user.email}</td>
                        <td className="py-2">
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : 'N/A'}
                        </td>
                        <td className="py-2">
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            user.user_role === 'admin' ? "bg-purple-100 text-purple-800" :
                            user.user_role === 'staff' ? "bg-blue-100 text-blue-800" :
                            user.user_role === 'student' ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          )}>
                            {user.user_role.charAt(0).toUpperCase() + user.user_role.slice(1)}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.user_role);
                            }}
                          >
                            Change Role
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No Users Found</h3>
                <p className="text-gray-500">
                  No users match your search criteria.
                </p>
              </div>
            )}
          </div>
          
          {/* Change role dialog */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Change User Role</h3>
                <p className="text-gray-700 mb-4">
                  Update role for <span className="font-semibold">{selectedUser.email}</span>
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Role</label>
                    <div className={cn(
                      "inline-block px-3 py-1 rounded-full text-sm",
                      selectedUser.user_role === 'admin' ? "bg-purple-100 text-purple-800" :
                      selectedUser.user_role === 'staff' ? "bg-blue-100 text-blue-800" :
                      selectedUser.user_role === 'student' ? "bg-green-100 text-green-800" :
                      "bg-gray-100 text-gray-800"
                    )}>
                      {selectedUser.user_role.charAt(0).toUpperCase() + selectedUser.user_role.slice(1)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">New Role</label>
                    <Select
                      value={newRole}
                      onValueChange={setNewRole}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="visitor">Visitor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedUser(null)}
                      disabled={updatingRole}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleRoleChange}
                      disabled={updatingRole || newRole === selectedUser.user_role}
                    >
                      {updatingRole ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Role'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default UserManagement;
