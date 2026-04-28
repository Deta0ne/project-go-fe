import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { logout } from "@/lib/actions/auth"
import { Files, PlusCircle, LogOut, LucideIcon } from "lucide-react"
import Link from "next/link"

interface QuickActionProps {
  icon: LucideIcon
  title: string
  description: string
  href: string
  variant?: "default" | "secondary"
}

function QuickActionCard({ icon: Icon, title, description, href, variant = "default" }: QuickActionProps) {
  return (
    <Button
      asChild
      variant={variant}
      className="h-auto w-full justify-start p-4 transition-all hover:scale-[1.02]"
    >
      <Link href={href} className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-3">
        <Icon className="h-6 w-6 opacity-80 shrink-0" />
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="text-xs opacity-80 mt-1">{description}</div>
        </div>
      </Link>
    </Button>
  )
}

export default function Page() {
  return (
    <div className="container mx-auto flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome back!
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your projects and collaborate with your team in real-time
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <QuickActionCard
            icon={PlusCircle}
            title="Create New Project"
            description="Start a new project from scratch"
            href="/projects/create"
          />
          <QuickActionCard
            icon={Files}
            title="View Projects"
            description="Browse all your existing projects"
            href="/projects"
            variant="secondary"
          />
        </div>

        {/* Info Card */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Getting Started</CardTitle>
            <CardDescription className="text-sm">
              Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded-md">D</kbd> to toggle dark mode
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Your workspace is ready to go!
              </p>
              <form action={logout}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
