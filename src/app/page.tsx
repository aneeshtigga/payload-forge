
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Info, AlertTriangle, X } from 'lucide-react';
import { TemplateCard } from '@/components/payload-forge/template-card';
import type { StoredTemplate } from '@/lib/template-store';
import { getTemplates, deleteTemplate, initializeDefaultTemplate } from '@/lib/template-store';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ManageTemplatesPage() {
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [templateToDelete, setTemplateToDelete] = useState<StoredTemplate | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState('');
  const [showQuickGuide, setShowQuickGuide] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    // Initialize default template if none exist - this now checks Firestore.
    // It's better to run this once, perhaps on app startup or a special admin action.
    // For simplicity here, it runs on page load if templates are empty.
    await initializeDefaultTemplate(); 
    const fetchedTemplates = await getTemplates();
    setTemplates(fetchedTemplates);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDeleteInitiated = (template: StoredTemplate) => {
    setTemplateToDelete(template);
    setDeleteConfirmationId(''); // Clear previous input
  };

  const handleDeleteConfirmed = async () => {
    if (templateToDelete && deleteConfirmationId === templateToDelete.id) {
      setIsLoading(true);
      const success = await deleteTemplate(templateToDelete.id);
      if (success) {
        await fetchTemplates(); // Re-fetch templates after deletion
        toast({ title: "Template deleted", description: `Template "${templateToDelete.name}" has been successfully deleted.` });
      } else {
        toast({ title: "Error", description: "Could not delete the template.", variant: "destructive" });
      }
      setTemplateToDelete(null);
      setDeleteConfirmationId('');
      setIsLoading(false);
    } else {
      toast({ title: "Error", description: "Template ID mismatch. Deletion cancelled.", variant: "destructive" });
    }
  };

  const closeDeleteDialog = () => {
    setTemplateToDelete(null);
    setDeleteConfirmationId('');
  }

  if (isLoading) {
    return <div className="text-center py-10">Loading templates from database...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Job Templates</h1>
          <p className="text-muted-foreground">
            Select an existing template to use or edit, or create a new one from scratch.
          </p>
        </div>
         <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/configure?mode=create">
              <PlusCircle className="h-5 w-5" /> Create New Template
            </Link>
          </Button>
      </div>
      
      {showQuickGuide && (
        <Card className="bg-secondary/30 border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg text-primary">Quick Guide</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowQuickGuide(false)} 
                className="h-7 w-7 text-muted-foreground hover:bg-[#efefef] hover:text-[hsl(var(--muted-foreground))]"
                aria-label="Close guide"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1 pt-2">
            <p>&bull; <strong>Use Template:</strong> Quickly generate a JSON payload. Only EMR Cluster, Job Name, Main Application File, and Main Class can be changed. Changes are NOT saved to the template.</p>
            <p>&bull; <strong>Edit Template:</strong> Modify all parameters of an existing template and save your changes.</p>
            <p>&bull; <strong>Create New Template:</strong> Build a new job configuration from scratch and save it as a template.</p>
          </CardContent>
        </Card>
      )}

      {templates.length === 0 && !isLoading ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-lg">No templates found.</p>
          <p className="text-muted-foreground">Get started by creating a new template.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={() => handleDeleteInitiated(template)}
            />
          ))}
        </div>
      )}

      {templateToDelete && (
        <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && closeDeleteDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                To permanently delete the template <strong>&quot;{templateToDelete.name}&quot;</strong> (ID: <strong>{templateToDelete.id}</strong>), please type its ID below. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Label htmlFor="deleteConfirmId" className="text-sm font-medium">
                Template ID
              </Label>
              <Input
                id="deleteConfirmId"
                value={deleteConfirmationId}
                onChange={(e) => setDeleteConfirmationId(e.target.value)}
                placeholder="Enter template ID to confirm"
                className="mt-1"
                autoFocus
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirmed} 
                disabled={deleteConfirmationId !== templateToDelete.id || isLoading}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-50"
              >
                {isLoading ? "Deleting..." : "Delete Template"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
