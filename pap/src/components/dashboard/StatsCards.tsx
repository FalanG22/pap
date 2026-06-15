"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
  variant?: "default" | "primary" | "accent";
};

export function StatsCard({ title, value, icon, trend, variant = "default" }: StatsCardProps) {
  return (
    <Card className={cn(
      "border-0 shadow-sm",
      variant === "primary" && "bg-primary text-primary-foreground",
      variant === "accent" && "bg-accent text-accent-foreground",
      variant === "default" && "bg-card",
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className={cn(
              "text-xs font-medium tracking-wide uppercase",
              variant === "default" && "text-muted-foreground",
            )}>
              {title}
            </p>
            <p className="text-2xl font-heading font-bold mt-1">{value}</p>
            {trend && (
              <p className="text-xs mt-1 opacity-70">{trend}</p>
            )}
          </div>
          <span className="text-2xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}
