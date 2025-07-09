"use client"

import { useState } from "react"
import { LoginForm } from "@/components/login-form"
import { AdminDashboard } from "@/components/admin-dashboard"

export default function Home() {
  const [user, setUser] = useState<any>(null)

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser)
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  return <AdminDashboard user={user} onLogout={handleLogout} />
}
