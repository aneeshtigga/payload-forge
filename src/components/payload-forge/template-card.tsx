
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, PlayCircle, Trash2, FileJson2, Fingerprint } from 'lucide-react';
import type { StoredTemplate } from '@/lib/template-store';

interface TemplateCardProps {
  template: StoredTemplate;
  onDelete: (template: StoredTemplate) => void;
}

export function TemplateCard({ template, onDelete }: TemplateCardProps) {
  const shortJsonPreview = JSON.stringify(template.data, null, 2).substring(0, 100) + (JSON.stringify(template.data, null, 2).length > 100 ? '...' : '');

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200 rounded-lg overflow-hidden">
      <CardHeader className="bg-card-foreground/5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-grow min-w-0">
            <CardTitle className="text-lg font-semibold line-clamp-2">{template.name}</CardTitle>
            {template.description && (
              <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {template.description}
              </CardDescription>
            )}
             <div className="flex items-center text-xs text-muted-foreground mt-2">
              <Fingerprint className="h-3 w-3 mr-1.5 text-primary/70" />
              <span className="truncate" title={template.id}>ID: {template.id}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0" 
            onClick={() => onDelete(template)}
            aria-label="Delete template"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="bg-muted/50 p-3 rounded-md shadow-inner max-h-28 overflow-y-auto">
          <FileJson2 className="inline-block h-4 w-4 mr-1 text-primary align-middle" />
          <span className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
            {shortJsonPreview}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t bg-card-foreground/5">
        <div className="flex w-full gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/configure?templateId=${template.id}&mode=edit`}>
              <Edit3 className="h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button asChild className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href={`/configure?templateId=${template.id}&mode=use`}>
              <PlayCircle className="h-4 w-4" /> Use
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
