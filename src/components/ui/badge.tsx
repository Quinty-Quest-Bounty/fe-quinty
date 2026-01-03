import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border-2 px-2.5 py-0.5 text-xs font-black uppercase tracking-tight transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0",
  {
    variants: {
      variant: {
        default:
          "border-gray-900 bg-primary text-primary-foreground hover:bg-primary/90 hover:border-blue-500",
        secondary:
          "border-gray-900 bg-white text-secondary-foreground hover:bg-gray-50 hover:border-gray-700",
        destructive:
          "border-gray-900 bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:border-red-500",
        outline: "text-foreground border-gray-900 bg-white hover:bg-gray-50 hover:border-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
