
import { z } from 'zod';

const KeyValueSchema = z.object({
  id: z.string().optional(), // For react-hook-form field array key
  key: z.string().min(1, "Key is required."),
  value: z.string().min(1, "Value is required."),
});

// Default Spark configurations
const defaultSparkConf = [
  { id: 'spark_1', key: "spark.app.name", value: "my-spark-app" },
  { id: 'spark_2', key: "spark.driver.memory", value: "4G" },
  { id: 'spark_3', key: "spark.executor.cores", value: "2" },
  { id: 'spark_4', key: "spark.executor.memory", value: "4G" },
  { id: 'spark_5', key: "spark.executor.instances", value: "2" },
];

// Default Hadoop configurations
const defaultHadoopConf = [
  { id: 'hadoop_1', key: "hive.metastore.uris", value: "thrift://your-hive-metastore:9083" },
  { id: 'hadoop_2', key: "fs.s3a.connection.ssl.enabled", value: "true" },
];

export const emrClusterValues = [
  "default",
  "ump-analytics-workflow-1",
  "ump-analytics-workflow-2",
  "ump-analytics-workflow-3",
  "ump-analytics-workflow-4",
  "ump-analytics-workflow-5",
] as const;
export type EmrClusterValue = (typeof emrClusterValues)[number];

export const emrClusterOptions: { value: EmrClusterValue; label: string }[] = emrClusterValues.map(value => ({
    value,
    label: value
}));


export const payloadFormSchema = z.object({
  // Root level fields that are also in configuration
  job_name: z.string().min(1, "Job Name is required."),
  ams_app_name: z.string().min(1, "AMS App Name is required."),
  config_name: z.string().min(1, "Config Name is required."),
  
  // Other root level fields
  job_priority: z.enum(["HIGH", "MEDIUM", "LOW"], { errorMap: () => ({ message: "Job Priority is required."}) }),

  // Fields that will be placed directly under 'configuration'
  stop_job_after_minutes: z.coerce.number({invalid_type_error: "Must be a number."}).int("Must be an integer.").positive("Must be a positive integer."),
  docker_image_path: z.string().min(1, "Docker Image Path is required."),
  main_application_file: z.string().min(1, "Main Application File is required."),
  main_class: z.string().min(1, "Main Class is required."),
  language: z.enum(["Scala", "Python", "Java"], { errorMap: () => ({ message: "Language is required."}) }),
  
  // Fields for 'configuration.compute_platform_properties'
  emr_cluster: z.enum(emrClusterValues, { errorMap: () => ({ message: "EMR Cluster is required."})}),
  graviton_enabled_compute: z.boolean().default(false), // Default to false for wider compatibility initially

  // Fields that are in 'configuration' AND 'configuration.compute_platform_properties'
  gpu_enabled_config: z.boolean().default(false),
  spot_toleration_config: z.boolean().default(false), // Default to false for on-demand if preferred

  // Key-value arrays
  spark_conf: z.array(KeyValueSchema).default(defaultSparkConf),
  hadoop_conf: z.array(KeyValueSchema).default(defaultHadoopConf),
});

export type PayloadFormValues = z.infer<typeof payloadFormSchema>;

export const defaultPayloadFormValues: PayloadFormValues = {
  job_name: "new-spark-job",
  ams_app_name: "new-ams-app",
  config_name: "new-app-config",
  job_priority: "MEDIUM",
  stop_job_after_minutes: 60,
  emr_cluster: "default", // Updated default
  graviton_enabled_compute: false,
  docker_image_path: "your-registry/your-image:tag",
  main_application_file: "s3://your-bucket/path/to/your-app.jar",
  main_class: "com.example.YourMainClass",
  language: "Scala",
  gpu_enabled_config: false,
  spot_toleration_config: false,
  spark_conf: defaultSparkConf,
  hadoop_conf: defaultHadoopConf,
};

export function transformToPayloadStructure(values: PayloadFormValues): any {
  const sparkConfObject = values.spark_conf.reduce((acc, { key, value }) => {
    if (key) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const hadoopConfObject = values.hadoop_conf.reduce((acc, { key, value }) => {
    if (key) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return {
    job_name: values.job_name,
    ams_app_name: values.ams_app_name,
    configuration: {
      config_name: values.config_name,
      ams_app_name: values.ams_app_name,
      stop_job_after_minutes: values.stop_job_after_minutes,
      type: "spark", // Fixed value
      compute_platform: "EMR_EC2", // Fixed value
      compute_platform_properties: {
        gpu_enabled: values.gpu_enabled_config,
        spot_toleration: values.spot_toleration_config,
        emr_cluster: values.emr_cluster,
        graviton_enabled: values.graviton_enabled_compute ? "true" : "false", // Convert boolean to string "true"/"false"
      },
      spark_conf: sparkConfObject,
      hadoop_conf: hadoopConfObject,
      docker_image_path: values.docker_image_path,
      main_application_file: values.main_application_file,
      gpu_enabled: values.gpu_enabled_config,
      spot_toleration: values.spot_toleration_config,
      main_class: values.main_class,
      language: values.language,
    },
    config_name: values.config_name,
    job_priority: values.job_priority,
  };
}
