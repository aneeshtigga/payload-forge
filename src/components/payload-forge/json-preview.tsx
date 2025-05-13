"use client";

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Check, ClipboardCopy, Download } from 'lucide-react';
import { useState, useEffect } from 'react';

interface JsonPreviewProps {
  jsonData: object;
  fileName?: string;
}

export function JsonPreview({ jsonData, fileName = "payload.json" }: JsonPreviewProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [jsonString, setJsonString] = useState('');

  useEffect(() => {
    try {
      setJsonString(JSON.stringify(jsonData, null, 2));
    } catch (error) {
      setJsonString("Error: Invalid JSON data provided.");
      console.error("Error stringifying JSON for preview:", error);
    }
  }, [jsonData]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "The JSON payload has been copied.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Download started!",
        description: `Payload will be saved as ${fileName}.`,
      });
    } catch (error) {
       toast({
        title: "Download failed",
        description: "Could not initiate download. Please try again.",
        variant: "destructive",
      });
      console.error('Failed to download JSON: ', error);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Generated JSON Payload</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={!jsonString || jsonString.startsWith("Error:")}>
            {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </Button>
          <Button variant="default" size="sm" onClick={handleDownload} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!jsonString || jsonString.startsWith("Error:")}>
            <Download className="h-4 w-4" />
            Download JSON
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-grow rounded-md border bg-muted/30 p-1 shadow-inner h-[calc(100vh-250px)] md:h-auto"> {/* Adjusted height */}
        <pre className="text-sm p-4 whitespace-pre-wrap break-all">
          <code>{jsonString}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}