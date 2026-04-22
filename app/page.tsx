import { Button } from "@/components/ui/button"
import { logout } from "@/lib/actions/auth"
import Link from "next/link"

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
        <form action={logout}>
          <Button type="submit">Logout</Button>
        </form>
        <div className="flex flex-col gap-4 text-sm leading-loose">
          <Button asChild>
            <Link href="/projects/create">New project</Link>
          </Button>
          <Button asChild>
            <Link href="/projects">Projects</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
