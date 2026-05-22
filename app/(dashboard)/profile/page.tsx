import { Header } from '@/components/layout/Header'
import { ProfileTabs } from '@/components/profile/ProfileTabs'

export default function ProfilePage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Profile Manager" />
      <div className="flex-1 overflow-y-auto p-6">
        <ProfileTabs />
      </div>
    </div>
  )
}
