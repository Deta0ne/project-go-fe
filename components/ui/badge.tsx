import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-stone-50 text-stone-600 ring-stone-200",
        secondary: "bg-stone-100 text-stone-700 ring-stone-200",
        outline: "bg-transparent text-stone-600 ring-stone-300",
        destructive: "bg-red-50 text-red-700 ring-red-200",
        warning: "bg-amber-50 text-amber-700 ring-amber-200",
        success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        info: "bg-sky-50 text-sky-700 ring-sky-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
