import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { ROLE_DISPLAY_NAMES } from '@/store/slices/authSlice'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  Edit2, 
  Save, 
  X,
  Lock,
  Key,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user)
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleSave = async () => {
    // TODO: Implement API call to update user profile
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been updated successfully.',
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedUser({
      fullName: user?.fullName || '',
      email: user?.email || '',
      mobile: user?.mobile || '',
    })
    setIsEditing(false)
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      })
      return
    }
    
    // TODO: Implement API call to change password
    toast({
      title: 'Password Changed',
      description: 'Your password has been changed successfully.',
    })
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getPermissionCount = () => {
    if (!user?.tablePermissions) return { total: 0, withAccess: 0 }
    const total = user.tablePermissions.length
    const withAccess = user.tablePermissions.filter(p => p.canView).length
    return { total, withAccess }
  }

  const permissionStats = getPermissionCount()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="bg-[#1DA1F2] hover:bg-[#A52222]">
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src="/placeholder.svg" alt={user.fullName} />
              <AvatarFallback className="bg-[#1DA1F2] text-white text-2xl">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{user.fullName}</h2>
                <Badge 
                  variant={user.isActive ? "default" : "secondary"}
                  className={user.isActive ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {user.isActive ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <Clock className="mr-1 h-3 w-3" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="font-medium text-[#1DA1F2]">{ROLE_DISPLAY_NAMES[user.role]}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                {user.mobile && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {user.mobile}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Account Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        {/* Account Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={editedUser.fullName}
                      onChange={(e) => setEditedUser({ ...editedUser, fullName: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={editedUser.email}
                      onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="mobile"
                      value={editedUser.mobile}
                      onChange={(e) => setEditedUser({ ...editedUser, mobile: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="role"
                      value={ROLE_DISPLAY_NAMES[user.role]}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="bg-[#1DA1F2] hover:bg-[#A52222]">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handlePasswordChange} className="bg-[#1DA1F2] hover:bg-[#A52222]">
                  <Lock className="mr-2 h-4 w-4" />
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Table Permissions</CardTitle>
              <CardDescription>
                View your access permissions for different tables
                <div className="flex gap-4 mt-2">
                  <Badge variant="outline">
                    {permissionStats.withAccess} / {permissionStats.total} tables with access
                  </Badge>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.tablePermissions && user.tablePermissions.length > 0 ? (
                <div className="space-y-4">
                  {user.tablePermissions.map((permission, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{permission.tableName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {permission.tableType === 'system' ? 'System Table' : 'Custom Table'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={permission.canView ? "default" : "secondary"}>
                          {permission.canView ? 'View' : 'No View'}
                        </Badge>
                        <Badge variant={permission.canCreate ? "default" : "secondary"}>
                          {permission.canCreate ? 'Create' : 'No Create'}
                        </Badge>
                        <Badge variant={permission.canEdit ? "default" : "secondary"}>
                          {permission.canEdit ? 'Edit' : 'No Edit'}
                        </Badge>
                        <Badge variant={permission.canDelete ? "default" : "secondary"}>
                          {permission.canDelete ? 'Delete' : 'No Delete'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No table permissions assigned
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
