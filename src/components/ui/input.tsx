import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full border-2 border-gray-900 bg-white px-3 py-1 text-base font-mono transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-foreground placeholder:text-gray-400 placeholder:uppercase placeholder:text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500 hover:border-gray-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
