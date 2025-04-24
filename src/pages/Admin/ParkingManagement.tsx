
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Building {
  id: string;
  name: string;
  code: string;
  location?: string;
  is_active: boolean;
}

interface SpotType {
  id: string;
  name: string;
  description?: string;
  is_shaded: boolean;
}

interface ParkingSpot {
  id: string;
  building_id: string;
  spot_type_id: string;
  spot_number: number;
  is_active: boolean;
  building?: {
    name: string;
    code: string;
  };
  spot_type?: {
    name: string;
    is_shaded: boolean;
  };
}

const ParkingManagement = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  // Redirect non-admin users
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Parking Management</h1>
        <p className="text-gray-500">Configure buildings, spot types, and parking spots</p>
      </div>
      
      <Tabs defaultValue="buildings">
        <TabsList>
          <TabsTrigger value="buildings">Buildings</TabsTrigger>
          <TabsTrigger value="spot-types">Spot Types</TabsTrigger>
          <TabsTrigger value="parking-spots">Parking Spots</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buildings">
          <BuildingsManager />
        </TabsContent>
        
        <TabsContent value="spot-types">
          <SpotTypesManager />
        </TabsContent>
        
        <TabsContent value="parking-spots">
          <ParkingSpotsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const BuildingsManager = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Omit<Building, 'id'>>({
    name: '',
    code: '',
    location: '',
    is_active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [savingLoading, setSavingLoading] = useState(false);
  
  // Load buildings
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('buildings')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setBuildings(data || []);
      } catch (error) {
        console.error('Error loading buildings:', error);
        toast.error('Failed to load buildings');
      } finally {
        setLoading(false);
      }
    };
    
    loadBuildings();
  }, []);
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      location: '',
      is_active: true,
    });
    setEditingId(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSavingLoading(true);
      
      if (editingId) {
        // Update existing building
        const { error } = await supabase
          .from('buildings')
          .update({
            name: formData.name,
            code: formData.code,
            location: formData.location,
            is_active: formData.is_active,
          })
          .eq('id', editingId);
        
        if (error) throw error;
        
        // Update local state
        setBuildings(buildings.map(building => 
          building.id === editingId ? { ...building, ...formData } : building
        ));
        
        toast.success('Building updated successfully');
      } else {
        // Create new building
        const { data, error } = await supabase
          .from('buildings')
          .insert([formData])
          .select();
        
        if (error) throw error;
        
        // Update local state
        if (data) {
          setBuildings([...buildings, data[0]]);
        }
        
        toast.success('Building created successfully');
      }
      
      resetForm();
    } catch (error: any) {
      console.error('Error saving building:', error);
      toast.error(error.message || 'Failed to save building');
    } finally {
      setSavingLoading(false);
    }
  };
  
  // Edit building
  const handleEdit = (building: Building) => {
    setFormData({
      name: building.name,
      code: building.code,
      location: building.location || '',
      is_active: building.is_active,
    });
    setEditingId(building.id);
  };
  
  // Delete building
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      setSavingLoading(true);
      
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', deleteId);
      
      if (error) throw error;
      
      // Update local state
      setBuildings(buildings.filter(building => building.id !== deleteId));
      
      toast.success('Building deleted successfully');
      setDeleteId(null);
    } catch (error: any) {
      console.error('Error deleting building:', error);
      toast.error(error.message || 'Failed to delete building');
    } finally {
      setSavingLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? 'Edit Building' : 'Add New Building'}
          </CardTitle>
          <CardDescription>
            {editingId ? 'Update building information' : 'Create a new building'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Building Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">Building Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="is-active">Status</Label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={savingLoading}>
                {savingLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Buildings</CardTitle>
          <CardDescription>Manage existing buildings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : buildings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Code</th>
                    <th className="text-left py-2">Location</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {buildings.map((building) => (
                    <tr key={building.id} className="border-b">
                      <td className="py-2">{building.name}</td>
                      <td className="py-2">{building.code}</td>
                      <td className="py-2">{building.location || '-'}</td>
                      <td className="py-2">
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full",
                          building.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {building.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(building)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(building.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No buildings found</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Building</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this building? This will also delete all associated parking spots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SpotTypesManager = () => {
  const [spotTypes, setSpotTypes] = useState<SpotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Omit<SpotType, 'id'>>({
    name: '',
    description: '',
    is_shaded: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [savingLoading, setSavingLoading] = useState(false);
  
  // Load spot types
  useEffect(() => {
    const loadSpotTypes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('spot_types')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setSpotTypes(data || []);
      } catch (error) {
        console.error('Error loading spot types:', error);
        toast.error('Failed to load spot types');
      } finally {
        setLoading(false);
      }
    };
    
    loadSpotTypes();
  }, []);
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_shaded: false,
    });
    setEditingId(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSavingLoading(true);
      
      if (editingId) {
        // Update existing spot type
        const { error } = await supabase
          .from('spot_types')
          .update({
            name: formData.name,
            description: formData.description,
            is_shaded: formData.is_shaded,
          })
          .eq('id', editingId);
        
        if (error) throw error;
        
        // Update local state
        setSpotTypes(spotTypes.map(spotType => 
          spotType.id === editingId ? { ...spotType, ...formData } : spotType
        ));
        
        toast.success('Spot type updated successfully');
      } else {
        // Create new spot type
        const { data, error } = await supabase
          .from('spot_types')
          .insert([formData])
          .select();
        
        if (error) throw error;
        
        // Update local state
        if (data) {
          setSpotTypes([...spotTypes, data[0]]);
        }
        
        toast.success('Spot type created successfully');
      }
      
      resetForm();
    } catch (error: any) {
      console.error('Error saving spot type:', error);
      toast.error(error.message || 'Failed to save spot type');
    } finally {
      setSavingLoading(false);
    }
  };
  
  // Edit spot type
  const handleEdit = (spotType: SpotType) => {
    setFormData({
      name: spotType.name,
      description: spotType.description || '',
      is_shaded: spotType.is_shaded,
    });
    setEditingId(spotType.id);
  };
  
  // Delete spot type
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      setSavingLoading(true);
      
      const { error } = await supabase
        .from('spot_types')
        .delete()
        .eq('id', deleteId);
      
      if (error) throw error;
      
      // Update local state
      setSpotTypes(spotTypes.filter(spotType => spotType.id !== deleteId));
      
      toast.success('Spot type deleted successfully');
      setDeleteId(null);
    } catch (error: any) {
      console.error('Error deleting spot type:', error);
      toast.error(error.message || 'Failed to delete spot type');
    } finally {
      setSavingLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? 'Edit Spot Type' : 'Add New Spot Type'}
          </CardTitle>
          <CardDescription>
            {editingId ? 'Update spot type information' : 'Create a new spot type'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="is-shaded">Shaded</Label>
                <Select
                  value={formData.is_shaded ? 'shaded' : 'not-shaded'}
                  onValueChange={(value) => setFormData({ ...formData, is_shaded: value === 'shaded' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shaded">Shaded</SelectItem>
                    <SelectItem value="not-shaded">Not Shaded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={savingLoading}>
                {savingLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Spot Types</CardTitle>
          <CardDescription>Manage existing spot types</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : spotTypes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-left py-2">Shaded</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {spotTypes.map((spotType) => (
                    <tr key={spotType.id} className="border-b">
                      <td className="py-2">{spotType.name}</td>
                      <td className="py-2">{spotType.description || '-'}</td>
                      <td className="py-2">
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full",
                          spotType.is_shaded ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        )}>
                          {spotType.is_shaded ? 'Shaded' : 'Not Shaded'}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(spotType)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(spotType.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No spot types found</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Spot Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this spot type? This will also affect all associated parking spots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ParkingSpotsManager = () => {
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [spotTypes, setSpotTypes] = useState<SpotType[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Omit<ParkingSpot, 'id' | 'building' | 'spot_type'>>({
    building_id: '',
    spot_type_id: '',
    spot_number: 1,
    is_active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [savingLoading, setSavingLoading] = useState(false);
  const [bulkCount, setBulkCount] = useState(1);
  
  // Load related data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load buildings
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select('*')
          .order('name');
        
        if (buildingsError) throw buildingsError;
        setBuildings(buildingsData || []);
        
        // Load spot types
        const { data: spotTypesData, error: spotTypesError } = await supabase
          .from('spot_types')
          .select('*')
          .order('name');
        
        if (spotTypesError) throw spotTypesError;
        setSpotTypes(spotTypesData || []);
        
        // Set default values if data exists
        if (buildingsData?.length > 0) {
          setFormData(prev => ({ ...prev, building_id: buildingsData[0].id }));
        }
        
        if (spotTypesData?.length > 0) {
          setFormData(prev => ({ ...prev, spot_type_id: spotTypesData[0].id }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Load parking spots when building is selected
  useEffect(() => {
    if (!selectedBuilding) {
      setParkingSpots([]);
      return;
    }
    
    const loadParkingSpots = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('parking_spots')
          .select(`
            *,
            building:building_id(name, code),
            spot_type:spot_type_id(name, is_shaded)
          `)
          .eq('building_id', selectedBuilding)
          .order('spot_number');
        
        if (error) throw error;
        setParkingSpots(data || []);
      } catch (error) {
        console.error('Error loading parking spots:', error);
        toast.error('Failed to load parking spots');
      } finally {
        setLoading(false);
      }
    };
    
    loadParkingSpots();
  }, [selectedBuilding]);
  
  // Reset form
  const resetForm = () => {
    setFormData({
      building_id: buildings.length > 0 ? buildings[0].id : '',
      spot_type_id: spotTypes.length > 0 ? spotTypes[0].id : '',
      spot_number: 1,
      is_active: true,
    });
    setEditingId(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSavingLoading(true);
      
      if (editingId) {
        // Update existing spot
        const { error } = await supabase
          .from('parking_spots')
          .update({
            building_id: formData.building_id,
            spot_type_id: formData.spot_type_id,
            spot_number: formData.spot_number,
            is_active: formData.is_active,
          })
          .eq('id', editingId);
        
        if (error) throw error;
        
        // Reload spots
        if (selectedBuilding === formData.building_id) {
          const { data: updatedSpots } = await supabase
            .from('parking_spots')
            .select(`
              *,
              building:building_id(name, code),
              spot_type:spot_type_id(name, is_shaded)
            `)
            .eq('id', editingId)
            .single();
          
          if (updatedSpots) {
            setParkingSpots(spots => 
              spots.map(spot => spot.id === editingId ? updatedSpots : spot)
            );
          }
        }
        
        toast.success('Parking spot updated successfully');
      } else {
        // Create new spots in bulk
        const spotsToCreate = [];
        
        // Find the highest spot number for this building
        let highestNumber = 0;
        if (parkingSpots.length > 0) {
          highestNumber = Math.max(...parkingSpots.map(spot => spot.spot_number));
        }
        
        // Create array of spots to insert
        for (let i = 0; i < bulkCount; i++) {
          spotsToCreate.push({
            building_id: formData.building_id,
            spot_type_id: formData.spot_type_id,
            spot_number: highestNumber + i + 1,
            is_active: formData.is_active,
          });
        }
        
        const { error } = await supabase
          .from('parking_spots')
          .insert(spotsToCreate);
        
        if (error) throw error;
        
        // If the current selected building matches, reload spots
        if (selectedBuilding === formData.building_id) {
          const { data: newSpots } = await supabase
            .from('parking_spots')
            .select(`
              *,
              building:building_id(name, code),
              spot_type:spot_type_id(name, is_shaded)
            `)
            .eq('building_id', selectedBuilding)
            .order('spot_number');
          
          if (newSpots) {
            setParkingSpots(newSpots);
          }
        }
        
        toast.success(`${bulkCount} parking spot(s) created successfully`);
      }
      
      resetForm();
    } catch (error: any) {
      console.error('Error saving parking spot:', error);
      toast.error(error.message || 'Failed to save parking spot');
    } finally {
      setSavingLoading(false);
    }
  };
  
  // Edit spot
  const handleEdit = (spot: ParkingSpot) => {
    setFormData({
      building_id: spot.building_id,
      spot_type_id: spot.spot_type_id,
      spot_number: spot.spot_number,
      is_active: spot.is_active,
    });
    setEditingId(spot.id);
  };
  
  // Delete spot
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      setSavingLoading(true);
      
      const { error } = await supabase
        .from('parking_spots')
        .delete()
        .eq('id', deleteId);
      
      if (error) throw error;
      
      // Update local state
      setParkingSpots(parkingSpots.filter(spot => spot.id !== deleteId));
      
      toast.success('Parking spot deleted successfully');
      setDeleteId(null);
    } catch (error: any) {
      console.error('Error deleting parking spot:', error);
      toast.error(error.message || 'Failed to delete parking spot');
    } finally {
      setSavingLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? 'Edit Parking Spot' : 'Add New Parking Spots'}
          </CardTitle>
          <CardDescription>
            {editingId ? 'Update parking spot information' : 'Create new parking spots'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && buildings.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="building">Building</Label>
                  <Select
                    value={formData.building_id}
                    onValueChange={(value) => setFormData({ ...formData, building_id: value })}
                    disabled={editingId !== null}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name} ({building.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="spot-type">Spot Type</Label>
                  <Select
                    value={formData.spot_type_id}
                    onValueChange={(value) => setFormData({ ...formData, spot_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {spotTypes.map((spotType) => (
                        <SelectItem key={spotType.id} value={spotType.id}>
                          {spotType.name} {spotType.is_shaded ? '(Shaded)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {editingId ? (
                  <div className="space-y-2">
                    <Label htmlFor="spot-number">Spot Number</Label>
                    <Input
                      id="spot-number"
                      type="number"
                      min="1"
                      value={formData.spot_number}
                      onChange={(e) => setFormData({ ...formData, spot_number: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="bulk-count">Number of Spots to Create</Label>
                    <Input
                      id="bulk-count"
                      type="number"
                      min="1"
                      max="50"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(parseInt(e.target.value))}
                      required
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="is-active">Status</Label>
                  <Select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={savingLoading}>
                  {savingLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingId ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Parking Spots</CardTitle>
          <CardDescription>View and manage parking spots by building</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filter-building">Filter by Building</Label>
              <Select
                value={selectedBuilding || ""}
                onValueChange={(value) => setSelectedBuilding(value || null)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a building" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name} ({building.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedBuilding ? (
              loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : parkingSpots.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Spot #</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Shaded</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-right py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parkingSpots.map((spot) => (
                        <tr key={spot.id} className="border-b">
                          <td className="py-2">{spot.spot_number}</td>
                          <td className="py-2">{spot.spot_type?.name || 'Unknown'}</td>
                          <td className="py-2">
                            <span className={cn(
                              "px-2 py-1 text-xs rounded-full",
                              spot.spot_type?.is_shaded ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                            )}>
                              {spot.spot_type?.is_shaded ? 'Shaded' : 'Not Shaded'}
                            </span>
                          </td>
                          <td className="py-2">
                            <span className={cn(
                              "px-2 py-1 text-xs rounded-full",
                              spot.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            )}>
                              {spot.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-2 text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(spot)}>Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(spot.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No parking spots found for this building</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Select a building to view its parking spots</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Parking Spot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this parking spot? This will remove all associated bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default ParkingManagement;
