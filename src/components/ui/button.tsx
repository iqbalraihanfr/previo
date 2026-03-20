"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[12px] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(46,50,48,0.06)] hover:bg-primary/90",
        outline:
          "border-border bg-card text-primary hover:border-primary/25 hover:bg-secondary hover:text-primary aria-expanded:bg-secondary aria-expanded:text-primary",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-secondary/85 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost: "text-primary hover:bg-primary/10 hover:text-primary aria-expanded:bg-primary/10 aria-expanded:text-primary",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 gap-1 rounded-[10px] px-3 text-xs in-data-[slot=button-group]:rounded-[10px] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-[12px] px-3.5 text-[0.85rem] in-data-[slot=button-group]:rounded-[12px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-11",
        "icon-xs":
          "size-8 rounded-[10px] in-data-[slot=button-group]:rounded-[10px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-[12px] in-data-[slot=button-group]:rounded-[12px]",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
