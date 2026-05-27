import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import ProfileSettings from "./profile-settings"
import SecuritySettings from "./security-settings"
import NotificationSettings from "./notification-settings"
import { ThemeCustomizerContent } from "@/components/theme-customizer"
import { User, Shield, Bell, Palette } from "lucide-react"

export default function SettingsContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1DA1F2]">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[540px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme Customizer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <ProfileSettings />
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <SecuritySettings />
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <NotificationSettings />
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card>
            <ThemeCustomizerContent />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
