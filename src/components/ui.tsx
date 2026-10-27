import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...values: ClassValue[]) { return twMerge(clsx(values)); }

const buttonVariants = cva("inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[5px] px-5 text-sm font-extrabold transition-[background-color,color,transform] duration-200 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15601d] disabled:cursor-not-allowed disabled:opacity-50", {
  variants: { variant: { primary: "bg-[#15601d] text-white hover:bg-[#063635]", secondary: "border border-[#b8cdbb] bg-white text-[#063635] hover:bg-[#e8f7eb]", ghost: "text-[#15601d] hover:bg-[#e8f7eb]", bright: "bg-[#6dfd8c] text-black hover:bg-[#ccffd6]" } },
  defaultVariants: { variant: "primary" },
});

export function Button({ className, variant, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export function Card({ className, ...props }: React.ComponentProps<"section">) { return <section className={cn("rounded-[8px] border border-[#d5e1d6] bg-white", className)} {...props} />; }
export function Badge({ className, ...props }: React.ComponentProps<"span">) { return <span className={cn("inline-flex items-center rounded-[4px] bg-[#ccffd6] px-2.5 py-1 text-xs font-semibold text-[#063635]", className)} {...props} />; }
export function Select({ className, ...props }: React.ComponentProps<"select">) { return <select className={cn("min-h-11 rounded-[5px] border border-[#a5bca9] bg-white px-3 text-sm text-[#101c16] focus-visible:outline-2 focus-visible:outline-[#15601d] disabled:opacity-50", className)} {...props} />; }
export function Input({ className, ...props }: React.ComponentProps<"input">) { return <input className={cn("min-h-11 rounded-[5px] border border-[#a5bca9] bg-white px-3 text-sm text-[#101c16] placeholder:text-[#48594f] focus-visible:outline-2 focus-visible:outline-[#15601d] disabled:opacity-50", className)} {...props} />; }
export function Separator({ className, ...props }: React.ComponentProps<typeof SeparatorPrimitive.Root>) { return <SeparatorPrimitive.Root className={cn("h-px w-full bg-[#d5e1d6]", className)} {...props} />; }
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) { return <div aria-hidden="true" className={cn("animate-pulse rounded-[5px] bg-[#e3eee5]", className)} {...props} />; }
export function Alert({ className, tone = "info", ...props }: React.ComponentProps<"div"> & { tone?: "info" | "warning" }) { return <div role="alert" className={cn("rounded-[6px] border p-4 text-sm leading-6", tone === "warning" ? "border-[#b8cdbb] bg-[#f0f6ed] text-[#063635]" : "border-[#bfe8c0] bg-[#edfff0] text-[#063635]", className)} {...props} />; }
