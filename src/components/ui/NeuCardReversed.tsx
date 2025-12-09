import * as React from "react";
import { cn } from "@/lib/utils";

interface NeuCardReversedProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const NeuCardReversed = React.forwardRef<HTMLDivElement, NeuCardReversedProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "neu-card-reversed rounded-2xl p-6 transition-all duration-200",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NeuCardReversed.displayName = "NeuCardReversed";

const NeuCardReversedHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
));
NeuCardReversedHeader.displayName = "NeuCardReversedHeader";

const NeuCardReversedTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-[var(--foreground)]",
      className
    )}
    {...props}
  />
));
NeuCardReversedTitle.displayName = "NeuCardReversedTitle";

const NeuCardReversedDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--muted-foreground)]", className)}
    {...props}
  />
));
NeuCardReversedDescription.displayName = "NeuCardReversedDescription";

const NeuCardReversedContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
NeuCardReversedContent.displayName = "NeuCardReversedContent";

const NeuCardReversedFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
NeuCardReversedFooter.displayName = "NeuCardReversedFooter";

export {
  NeuCardReversed,
  NeuCardReversedHeader,
  NeuCardReversedTitle,
  NeuCardReversedDescription,
  NeuCardReversedContent,
  NeuCardReversedFooter,
};
