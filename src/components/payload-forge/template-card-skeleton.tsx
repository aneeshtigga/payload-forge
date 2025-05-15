
"use client";

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TemplateCardSkeleton() {
  return (
    <Card className="flex flex-col h-full shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="bg-card-foreground/5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-grow min-w-0 space-y-2">
            <Skeleton className="h-5 w-3/4" /> {/* Title */}
            <Skeleton className="h-3 w-full" /> {/* Description line 1 */}
            <Skeleton className="h-3 w-1/2" /> {/* ID */}
          </div>
          <Skeleton className="h-8 w-8 shrink-0 rounded-md" /> {/* Delete button placeholder */}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="bg-muted/50 p-3 rounded-md shadow-inner">
          <Skeleton className="h-16 w-full" /> {/* JSON preview */}
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t bg-card-foreground/5">
        <div className="flex w-full gap-2">
          <Skeleton className="h-10 flex-1 rounded-md" /> {/* Edit button */}
          <Skeleton className="h-10 flex-1 rounded-md" /> {/* Use button */}
        </div>
      </CardFooter>
    </Card>
  );
}
