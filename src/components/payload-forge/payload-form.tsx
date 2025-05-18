
"use client";

import { useState, useEffect } from 'react';
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
import { Save, AlertTriangle, Search, Loader2 } from 'lucide-react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { searchArtylabByVersion, type ArtylabSearchInput } from '@/ai/flows/artylab-search-flow';


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

  // State for Artylab search
  const [artylabSearchVersion, setArtylabSearchVersion] = useState('');
  const [artylabSearchResults, setArtylabSearchResults] = useState<string[]>([]);
  const [isArtylabSearchLoading, setIsArtylabSearchLoading] = useState(false);
  const [isArtylabPopoverOpen, setIsArtylabPopoverOpen] = useState(false);

  const handleEmrSelectChange = (selectedValue: EmrClusterValue, fieldOnChange: (value: EmrClusterValue) => void, currentFieldValue: EmrClusterValue) => {
    if (PROD_CLUSTERS.includes(selectedValue)) {
      setPendingProdCluster(selectedValue);
      setClusterBeforeProdSelection(currentFieldValue); 
      setProdConfirmationInput(''); 
      setIsProdConfirmDialogOpen(true);
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
    form.setValue('emr_cluster', clusterBeforeProdSelection, { shouldValidate: true });
    setIsProdConfirmDialogOpen(false);
    setPendingProdCluster(null);
    toast({ title: "Selection Cancelled", description: `EMR Cluster selection reverted to ${clusterBeforeProdSelection}.` , variant: "default"});
  };

  const handleArtylabSearch = async () => {
    if (!artylabSearchVersion.trim()) {
      toast({ title: "Version Required", description: "Please enter a JAR version to search.", variant: "default" });
      return;
    }
    setIsArtylabSearchLoading(true);
    setArtylabSearchResults([]); // Clear previous results
    try {
      const input: ArtylabSearchInput = { version: artylabSearchVersion.trim() };
      const results = await searchArtylabByVersion(input);
      setArtylabSearchResults(results);
      if (results.length === 0) {
        toast({ title: "No Results", description: `No JAR files found for version "${artylabSearchVersion}".`, variant: "default" });
      }
    } catch (error) {
      console.error("Error searching Artylab:", error);
      // Updated error message as per previous request
      if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed'))) {
        toast({ title: "Search Failed", description: "Could not connect to Artylab. Make sure you're connected to the VPN.", variant: "destructive" });
      } else {
        toast({ title: "Search Failed", description: (error as Error).message || "Could not fetch results from Artylab.", variant: "destructive" });
      }
      setArtylabSearchResults([]);
    } finally {
      setIsArtylabSearchLoading(false);
      setIsArtylabPopoverOpen(true); // Open popover even if no results, to show "No results" message
    }
  };

  const handleArtylabPathSelect = (path: string) => {
    form.setValue('main_application_file', path, { shouldValidate: true });
    setIsArtylabPopoverOpen(false);
  };


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="bg-card-foreground/5">
              <CardTitle className="text-2xl">Job Identification & Execution</CardTitle>
              <CardDescription>Core identifiers and execution parameters for your job.
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
              
              {/* Main Application File with Artylab Search */}
              <FormField
                control={form.control}
                name="main_application_file"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Main Application File (URL or S3 Path)</FormLabel>
                    {isUseMode ? (
                      <div className="flex items-end gap-2">
                        <FormControl className="flex-grow">
                          <Input 
                            placeholder="e.g. s3://bucket/path/to/app.jar" 
                            {...field} 
                            disabled={isSaving} 
                          />
                        </FormControl>
                        <Input
                          type="text"
                          placeholder="JAR Version"
                          value={artylabSearchVersion}
                          onChange={(e) => setArtylabSearchVersion(e.target.value)}
                          className="w-1/3"
                          disabled={isSaving || isArtylabSearchLoading}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleArtylabSearch();
                            }
                          }}
                        />
                        <Popover open={isArtylabPopoverOpen} onOpenChange={setIsArtylabPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              onClick={handleArtylabSearch} 
                              disabled={isSaving || isArtylabSearchLoading}
                              className="shrink-0"
                              type="button"
                            >
                              {isArtylabSearchLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4" />
                              )}
                              <span>Search Artylab</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[600px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Filter results..." disabled={isArtylabSearchLoading} />
                              <CommandList>
                                {isArtylabSearchLoading && <CommandItem disabled>Loading...</CommandItem>}
                                <CommandEmpty>
                                  {artylabSearchResults.length === 0 && !isArtylabSearchLoading 
                                    ? "No results found." 
                                    : "Start typing to search or filter results."}
                                </CommandEmpty>
                                <CommandGroup>
                                  {artylabSearchResults.map((path) => (
                                    <CommandItem
                                      key={path}
                                      value={path}
                                      onSelect={() => handleArtylabPathSelect(path)}
                                      className="whitespace-normal break-words h-auto"
                                    >
                                      {path}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <FormControl>
                        <Input placeholder="e.g. s3://bucket/path/to/app.jar or https://..." {...field} disabled={isSaving} />
                      </FormControl>
                    )}
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
                            <Input type="number" placeholder="e.g. 420" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} disabled={isSaving} />
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
                errors={form.formState.errors}
              />

              <Separator />

              <DynamicKeyValueEditor
                control={form.control}
                name="hadoop_conf"
                title="Hadoop Configurations"
                errors={form.formState.errors}
              />
            </>
          )}

          {showSaveButton && formMode !== 'use' && (
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 mt-8" disabled={isSaving || isArtylabSearchLoading}>
              <Save className="mr-2 h-5 w-5" /> {isSaving ? "Saving..." : saveButtonText}
            </Button>
          )}
        </form>
      </Form>

      {isProdConfirmDialogOpen && (
        <AlertDialog open={isProdConfirmDialogOpen} onOpenChange={(open) => !open && handleProdClusterCancel()}>
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

