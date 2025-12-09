import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-xl border-none",
  {
    variants: {
      variant: {
        default: "bg-[var(--background)] text-[var(--foreground)] neu-button",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "bg-[var(--background)] text-[var(--foreground)] neu-button",
        secondary: "bg-[var(--background)] text-[var(--foreground)] neu-button",
        accent: "bg-[var(--accent)] text-[var(--accent-foreground)] neu-button",
        ghost: "bg-transparent hover:bg-[var(--muted)] border-none",
        link: "text-[var(--accent)] underline-offset-4 hover:underline border-none bg-transparent",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
