import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative";
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  change,
  changeType = "positive",
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-100",
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className="border border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
              <div className="h-8 bg-gray-200 rounded animate-pulse w-20" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-32" />
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-100">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className={cn(
                "text-sm font-medium",
                changeType === "positive" ? "text-green-600" : "text-red-600"
              )}>
                {change}
              </p>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBg)}>
            <Icon className={cn("text-lg", iconColor)} size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
