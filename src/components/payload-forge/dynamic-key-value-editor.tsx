import type { Control, FieldErrors } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus2, Trash2 } from 'lucide-react';
import type { PayloadFormValues } from '@/lib/payload-schema';

interface DynamicKeyValueEditorProps {
  control: Control<PayloadFormValues>;
  name: "spark_conf" | "hadoop_conf";
  title: string;
  errors: FieldErrors<PayloadFormValues>;
}

export function DynamicKeyValueEditor({ control, name, title, errors }: DynamicKeyValueEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl">{title}</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ id: `${name}_${fields.length + 1}`, key: '', value: '' })}
          className="ml-auto"
        >
          <FilePlus2 className="h-4 w-4" /> Add Property
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end space-x-2 p-3 bg-background/50 rounded-md shadow-sm">
              <div className="flex-1 space-y-1">
                <Label htmlFor={`${name}.${index}.key`}>Key</Label>
                <Input
                  id={`${name}.${index}.key`}
                  {...control.register(`${name}.${index}.key`)}
                  placeholder="e.g. spark.executor.memory"
                  className="bg-background"
                />
                {errors?.[name]?.[index]?.key && (
                  <p className="text-sm text-destructive">{errors[name]?.[index]?.key?.message}</p>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor={`${name}.${index}.value`}>Value</Label>
                <Input
                  id={`${name}.${index}.value`}
                  {...control.register(`${name}.${index}.value`)}
                  placeholder="e.g. 4g"
                  className="bg-background"
                />
                 {errors?.[name]?.[index]?.value && (
                  <p className="text-sm text-destructive">{errors[name]?.[index]?.value?.message}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="text-destructive hover:bg-destructive/10"
                aria-label="Remove property"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No properties added. Click "Add Property" to begin.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}