
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns'; // Added parseISO
import {
  payloadFormSchema,
  type PayloadFormValues,
  defaultPayloadFormValues,
  transformToPayloadStructure,
} from '@/lib/payload-schema';
import { PayloadForm } from '@/components/payload-forge/payload-form';
import { JsonPreview } from '@/components/payload-forge/json-preview';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getTemplateById, saveTemplate, type StoredTemplate } from '@/lib/template-store';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

type FormMode = 'create' | 'edit' | 'use';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

function ConfigurePageLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-grow space-y-2">
          <Skeleton className="h-6 w-1/4" /> {/* Last updated placeholder */}
          <Skeleton className="h-12 w-3/4" /> {/* Template Name placeholder */}
          <Skeleton className="h-5 w-1/2" /> {/* Template Description placeholder */}
        </div>
        <Skeleton className="h-10 w-full sm:w-40 rounded-md" /> {/* Back button placeholder */}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card className="lg:sticky lg:top-24 shadow-none border-none p-0">
          <CardContent className="p-0 space-y-6">
            {/* Form Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-20 w-full rounded-md" /> {/* A larger block for complex form sections */}
            <Skeleton className="h-12 w-full rounded-md" /> {/* Save button placeholder */}
          </CardContent>
        </Card>
        
        <div className="lg:sticky lg:top-24 h-full">
           <Card className="shadow-xl h-full">
             <CardContent className="p-6 h-full space-y-4">
               <Skeleton className="h-8 w-1/2" /> {/* JSON Preview Title */}
               <Skeleton className="h-10 w-full" /> {/* Buttons for copy/download */}
               <Skeleton className="h-64 w-full rounded-md" /> {/* JSON content area */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


function ConfigurePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const templateId = searchParams.get('templateId');
  const modeParam = searchParams.get('mode') as FormMode | null;

  const [formMode, setFormMode] = useState<FormMode>(modeParam || (templateId ? 'edit' : 'create'));
  const [currentTemplate, setCurrentTemplate] = useState<StoredTemplate | null>(null);
  const [generatedJson, setGeneratedJson] = useState<object>({});
  
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [templateDescriptionInput, setTemplateDescriptionInput] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);


  const form = useForm<PayloadFormValues>({
    resolver: zodResolver(payloadFormSchema),
    defaultValues: defaultPayloadFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    const loadTemplate = async () => {
      setIsLoading(true);
      let initialValues = { ...defaultPayloadFormValues }; // Create a new object to avoid mutation issues
      let fetchedTemplate: StoredTemplate | null = null;
      let currentMode = modeParam || (templateId ? 'edit' : 'create');

      if (templateId && (currentMode === 'edit' || currentMode === 'use')) {
        fetchedTemplate = await getTemplateById(templateId);
        if (fetchedTemplate) {
          initialValues = fetchedTemplate.data;
          setCurrentTemplate(fetchedTemplate);
          setTemplateNameInput(fetchedTemplate.name);
          setTemplateDescriptionInput(fetchedTemplate.description || '');
          setFormMode(currentMode);
        } else {
          toast({ title: "Template not found", description: "Redirecting to create new.", variant: "destructive" });
          router.replace('/configure?mode=create');
          currentMode = 'create';
          setFormMode('create');
          setTemplateNameInput('Untitled Payload Template');
          setTemplateDescriptionInput('');
        }
      } else if (currentMode === 'create') {
        setFormMode('create');
        setTemplateNameInput('Untitled Payload Template');
        setTemplateDescriptionInput('');
        setCurrentTemplate(null);
      } else {
        router.replace('/configure?mode=create');
        currentMode = 'create';
        setFormMode('create');
        setTemplateNameInput('Untitled Payload Template');
        setTemplateDescriptionInput('');
      }
      
      form.reset(initialValues); // Reset form with potentially fetched or default values
      setGeneratedJson(transformToPayloadStructure(initialValues));
      setIsLoading(false);
    };

    loadTemplate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, modeParam, router, toast]); // form.reset removed from deps, handling it within loadTemplate

  const watchedValues = form.watch();
  const watchedValuesString = JSON.stringify(watchedValues); // For dependency array

  useEffect(() => {
    if (!isLoading) {
        const newJson = transformToPayloadStructure(watchedValues);
        setGeneratedJson(newJson);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValuesString, isLoading]); // Use the stringified version

  const debouncedTemplateName = useDebounce(templateNameInput, 1500);
  const debouncedTemplateDescription = useDebounce(templateDescriptionInput, 1500);

  useEffect(() => {
    const autoSaveTemplateDetails = async () => {
      if (formMode === 'use' || !currentTemplate?.id || isLoading || isSaving) {
        return;
      }

      // Check if values actually changed from the loaded currentTemplate
      const nameChanged = debouncedTemplateName.trim() !== (currentTemplate.name || '').trim();
      const descriptionChanged = (debouncedTemplateDescription || '').trim() !== (currentTemplate.description || '').trim();

      if (!nameChanged && !descriptionChanged) {
        return;
      }
      
      if (debouncedTemplateName.trim() === '') {
        return; // Don't auto-save if name is empty.
      }
      
      setIsSaving(true);
      const currentFormData = form.getValues(); // Ensure this is the latest form data
      const saved = await saveTemplate(
        currentFormData, // Pass current form data, not just details
        debouncedTemplateName.trim(),
        debouncedTemplateDescription.trim(),
        currentTemplate.id
      );

      if (saved) {
        // Update currentTemplate with the potentially new 'updatedAt' and other details from 'saved'
        // Firestore save might not return the full object with server timestamps immediately in a simple way
        // So, we optimistically update with what we have.
        const updatedTemplate = await getTemplateById(saved.id); // Re-fetch to get server timestamps
        if (updatedTemplate) setCurrentTemplate(updatedTemplate);
        
        toast({
          title: 'Auto-saved!',
          description: 'Template details updated.',
          duration: 2000,
        });
      }
      setIsSaving(false);
    };

    if (!isLoading && (debouncedTemplateName !== templateNameInput || debouncedTemplateDescription !== templateDescriptionInput)) {
        // This condition is to ensure autosave triggers if debounced values catch up to actual input
        // but it might be redundant if the main check covers it. The primary trigger should be debounced values.
    }
    autoSaveTemplateDetails();
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTemplateName, debouncedTemplateDescription, formMode, isLoading, currentTemplate?.id, currentTemplate?.name, currentTemplate?.description, isSaving]);


  const handleFormSubmit = useCallback(async (values: PayloadFormValues) => {
    if (formMode === 'use') {
      toast({ title: "Info", description: "Changes in 'Use' mode are not saved to the template." });
      return;
    }
    if (!templateNameInput.trim()) {
      toast({ title: "Error", description: "Template name cannot be empty.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const saved = await saveTemplate(values, templateNameInput.trim(), templateDescriptionInput.trim(), currentTemplate?.id);
    setIsSaving(false);

    if (saved) {
      toast({ title: "Template Saved!", description: `Template "${saved.name}" has been successfully ${currentTemplate?.id ? 'updated' : 'created'}.` });
      
      const updatedTemplate = await getTemplateById(saved.id); // Re-fetch to get server timestamps
      if (updatedTemplate) {
          setCurrentTemplate(updatedTemplate);
          setTemplateNameInput(updatedTemplate.name);
          setTemplateDescriptionInput(updatedTemplate.description || '');
          form.reset(updatedTemplate.data); // Important: reset form with data from DB
      }


      if (formMode === 'create' && !templateId) { // If it was a new creation (no templateId in URL initially)
        router.replace(`/configure?templateId=${saved.id}&mode=edit`);
        setFormMode('edit'); // Explicitly set mode to edit
      }
    } else {
      toast({ title: "Save Failed", description: "Could not save the template to the database.", variant: "destructive" });
    }
  }, [formMode, templateNameInput, templateDescriptionInput, currentTemplate, toast, router, templateId, form]);
  
  const jobNameForDownload = form.getValues("job_name") || "payload";
  const downloadFileName = `${jobNameForDownload.replace(/[^a-z0-9_.-]/gi, '_')}.json`;
  const saveButtonText = isSaving ? "Saving..." : ((formMode === 'edit' || (formMode === 'create' && templateId)) ? 'Update Template' : 'Save New Template');

  const displayUpdatedAt = currentTemplate?.updatedAt
    ? format(typeof currentTemplate.updatedAt === 'string' ? parseISO(currentTemplate.updatedAt) : currentTemplate.updatedAt, "MMM d, yyyy, h:mm a")
    : null;


  if (isLoading) {
    return <ConfigurePageLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-grow">
          {displayUpdatedAt && formMode !== 'create' && (
            <p className="text-xs text-muted-foreground mb-1">
              Last updated: {displayUpdatedAt}
            </p>
          )}
          <Input
            value={templateNameInput}
            onChange={(e) => setTemplateNameInput(e.target.value)}
            placeholder="Untitled Payload Template"
            className="text-3xl !text-3xl underline decoration-dotted decoration-gray-400 decoration-2 underline-offset-4 font-bold border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto mb-1 disabled:bg-transparent disabled:cursor-default disabled:opacity-100"
            disabled={formMode === 'use' || isSaving}
          />
          <Input
            value={templateDescriptionInput}
            onChange={(e) => setTemplateDescriptionInput(e.target.value)}
            placeholder="Add a description..."
            className="text-sm text-muted-foreground border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto disabled:bg-transparent disabled:cursor-default disabled:opacity-100"
            disabled={formMode === 'use' || isSaving}
          />
        </div>
        <Button variant="outline" onClick={() => router.push('/')} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4" /> Back to Templates
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card className="lg:sticky lg:top-24 shadow-none border-none p-0">
          <CardContent className="p-0">
            <PayloadForm
              form={form}
              onSubmit={handleFormSubmit}
              formMode={formMode}
              showSaveButton={formMode !== 'use'}
              saveButtonText={saveButtonText}
              isSaving={isSaving}
            />
          </CardContent>
        </Card>
        
        <div className="lg:sticky lg:top-24 h-full">
           <Card className="shadow-xl h-full">
             <CardContent className="p-6 h-full">
              <JsonPreview jsonData={generatedJson} fileName={downloadFileName} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ConfigurePage() {
  return (
    // Suspense boundary for client components relying on searchParams
    <Suspense fallback={<ConfigurePageLoadingSkeleton />}>
      <ConfigurePageContent />
    </Suspense>
  );
}
