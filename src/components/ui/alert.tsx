import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const alertVariants = cva(
  "relative w-full rounded-[1rem] border p-4 shadow-md backdrop-blur-sm transition-all duration-300 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "border-white/60 bg-white/70 text-foreground hover:shadow-lg",
        destructive:
          "border-destructive/50 bg-destructive/10 backdrop-blur-md text-destructive dark:border-destructive [&>svg]:text-destructive hover:shadow-lg",
        success:
          "border-green-500/50 text-green-600 bg-green-50/80 backdrop-blur-md dark:border-green-500 [&>svg]:text-green-600 hover:shadow-lg",
        warning:
          "border-yellow-500/50 text-yellow-600 bg-yellow-50/80 backdrop-blur-md dark:border-yellow-500 [&>svg]:text-yellow-600 hover:shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }