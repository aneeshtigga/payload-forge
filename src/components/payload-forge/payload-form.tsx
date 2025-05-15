
"use client";

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DynamicKeyValueEditor } from './dynamic-key-value-editor';
import type { PayloadFormValues, EmrClusterValue } from '@/lib/payload-schema';
import { emrClusterOptions } from '@/lib/payload-schema';
import { Save, AlertTriangle } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';


type FormMode = 'create' | 'edit' | 'use';

interface PayloadFormProps {
  form: UseFormReturn<PayloadFormValues>;
  onSubmit: (values: PayloadFormValues) => void;
  formMode: FormMode;
  showSaveButton?: boolean;
  saveButtonText?: string;
  isSaving?: boolean; // Added isSaving prop
}

const PROD_CLUSTERS: EmrClusterValue[] = ["ump-analytics-workflow-1", "ump-analytics-workflow-2"];

export function PayloadForm({ form, onSubmit, formMode, showSaveButton = false, saveButtonText = "Save", isSaving = false }: PayloadFormProps) {
  const isUseMode = formMode === 'use';
  const { toast } = useToast();

  const [isProdConfirmDialogOpen, setIsProdConfirmDialogOpen] = useState(false);
  const [pendingProdCluster, setPendingProdCluster] = useState<EmrClusterValue | null>(null);
  const [clusterBeforeProdSelection, setClusterBeforeProdSelection] = useState<EmrClusterValue>(form.getValues('emr_cluster'));
  const [prodConfirmationInput, setProdConfirmationInput] = useState('');

  const handleEmrSelectChange = (selectedValue: EmrClusterValue, fieldOnChange: (value: EmrClusterValue) => void, currentFieldValue: EmrClusterValue) => {
    if (PROD_CLUSTERS.includes(selectedValue)) {
      setPendingProdCluster(selectedValue);
      setClusterBeforeProdSelection(currentFieldValue); 
      setProdConfirmationInput(''); 
      setIsProdConfirmDialogOpen(true);
      // Do not call fieldOnChange yet. It will be called on dialog confirmation.
    } else {
      fieldOnChange(selectedValue); 
      setPendingProdCluster(null);
    }
  };

  const handleProdClusterConfirm = () => {
    if (prodConfirmationInput === "PROD" && pendingProdCluster) {
      form.setValue('emr_cluster', pendingProdCluster, { shouldValidate: true });
      setIsProdConfirmDialogOpen(false);
      setPendingProdCluster(null);
      toast({ title: "Cluster Updated", description: `EMR Cluster set to ${pendingProdCluster}.` });
    } else {
      toast({ title: "Incorrect Confirmation", description: "Please type 'PROD' to confirm selection of this production cluster.", variant: "destructive" });
    }
  };

  const handleProdClusterCancel = () => {
    // Revert form value and Select component's display
    form.setValue('emr_cluster', clusterBeforeProdSelection, { shouldValidate: true });
    setIsProdConfirmDialogOpen(false);
    setPendingProdCluster(null);
    toast({ title: "Selection Cancelled", description: `EMR Cluster selection reverted to ${clusterBeforeProdSelection}.` , variant: "default"});
  };


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="bg-card-foreground/5">
              <CardTitle className="text-2xl">Job Identification & Execution</CardTitle>
              <CardDescription>Core identifiers and execution parameters for your job.
                {isUseMode && <span className="block text-primary font-semibold mt-1">Only fields in this section are editable in 'Use' mode.</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="job_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. my-spark-job-001" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emr_cluster"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EMR Cluster</FormLabel>
                    <Select
                      onValueChange={(value) => handleEmrSelectChange(value as EmrClusterValue, field.onChange, field.value)}
                      value={field.value}
                      disabled={isSaving}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select EMR Cluster" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {emrClusterOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="main_application_file"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Main Application File (URL or Path)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. s3://bucket/path/to/app.jar or https://..." {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="main_class"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Main Class</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. com.example.MySparkApp" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isUseMode && (
                <>
                  <FormField
                    control={form.control}
                    name="ams_app_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AMS App Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. my-ams-application" {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="config_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Configuration Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. my-app-config" {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="job_priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select job priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HIGH">HIGH</SelectItem>
                            <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                            <SelectItem value="LOW">LOW</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {!isUseMode && (
            <>
              <Separator />
              <Card className="shadow-xl overflow-hidden">
                <CardHeader className="bg-card-foreground/5">
                  <CardTitle className="text-2xl">Detailed Execution Configuration</CardTitle>
                  <CardDescription>Specify parameters related to job execution and resources.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="stop_job_after_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stop Job After (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g. 420" {...field} disabled={isSaving} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <FormField
                      control={form.control}
                      name="gpu_enabled_config"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background/50">
                          <div className="space-y-0.5">
                            <FormLabel>GPU Enabled</FormLabel>
                            <FormDescription>Enable GPU resources.</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSaving} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="spot_toleration_config"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background/50">
                          <div className="space-y-0.5">
                            <FormLabel>Spot Instance Toleration</FormLabel>
                            <FormDescription>Allow on spot instances.</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSaving} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="graviton_enabled_compute"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background/50">
                          <div className="space-y-0.5">
                            <FormLabel>Graviton Enabled</FormLabel>
                            <FormDescription>Utilize Graviton processors.</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSaving} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Separator />

              <Card className="shadow-xl overflow-hidden">
                <CardHeader className="bg-card-foreground/5">
                  <CardTitle className="text-2xl">Application Details</CardTitle>
                  <CardDescription>Provide information about the application artifact and entry point.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="docker_image_path"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Docker Image Path</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. your-registry/your-image:latest" {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Scala">Scala</SelectItem>
                            <SelectItem value="Python">Python</SelectItem>
                            <SelectItem value="Java">Java</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Separator />
              
              <DynamicKeyValueEditor
                control={form.control}
                name="spark_conf"
                title="Spark Configurations"
                errors={form.formState.errors} // Consider disabling DynamicKeyValueEditor fields if isSaving
              />

              <Separator />

              <DynamicKeyValueEditor
                control={form.control}
                name="hadoop_conf"
                title="Hadoop Configurations"
                errors={form.formState.errors} // Consider disabling DynamicKeyValueEditor fields if isSaving
              />
            </>
          )}

          {showSaveButton && formMode !== 'use' && (
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 mt-8" disabled={isSaving}>
              <Save className="mr-2 h-5 w-5" /> {saveButtonText}
            </Button>
          )}
        </form>
      </Form>

      {isProdConfirmDialogOpen && (
        <AlertDialog open={isProdConfirmDialogOpen} onOpenChange={setIsProdConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <AlertDialogTitle>Confirm Production Cluster Selection</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                You are selecting a production EMR cluster (<strong>{pendingProdCluster}</strong>). 
                To proceed, please type &quot;PROD&quot; in the box below and click Confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Label htmlFor="prodConfirmInput" className="text-sm font-medium">
                Type &quot;PROD&quot; to confirm
              </Label>
              <Input
                id="prodConfirmInput"
                value={prodConfirmationInput}
                onChange={(e) => setProdConfirmationInput(e.target.value)}
                placeholder="PROD"
                className="mt-1"
                autoFocus
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleProdClusterCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleProdClusterConfirm}
                disabled={prodConfirmationInput !== "PROD"}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-50"
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
