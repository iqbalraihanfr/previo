import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-[12px] border border-border bg-input px-3.5 py-3 text-base text-foreground transition-[background-color,border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-primary/35 focus-visible:ring-3 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:bg-input/70 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
