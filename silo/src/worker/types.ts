import { TImportJob } from "@plane/types";

export type WorkerEventType = "initiate" | "transform" | "push" | "finished";
export type UpdateEventType =
  | "INITIATED"
  | "PULLING"
  | "PULLED"
  | "TRANSFORMING"
  | "TRANSFORMED"
  | "PUSHING"
  | "FINISHED"
  | "ERROR";

export type TBatch<TSource> = {
  id: number;
  jobId: string;
  meta: {
    batchId: number;
    batch_start: number;
    batch_size: number;
    batch_end: number;
    total: {
      [k in keyof TSource]: number;
    };
  };
  data: TSource[];
};

// Interface for the transformer, used by the worker to pull, transform and push the data
export interface Migrator<TSource, TTarget, TJobConfig> {
  // Pull the data from the source, taking the configuration of the job
  pull: (job: TImportJob<TJobConfig>) => Promise<TSource[]>;
  // Batches can be understood as chunks of data, which can be processed in
  // parallel, while you keep in mind the performance of the system, it's also
  // necessary to keep in mind the relation between the data. For such cases,
  // keep in mind that there are two main types of relations, associations and
  // entities. Entities represent independent data, which needs to be present for
  // continuations of each batch and has to be the same in all the batches like
  // users, states, labels etc, while associations are relations that are tied
  // like, issue_comments are tied with issues, and issues are tied with cycles
  // and modules etc.
  batches: (job: TImportJob<TJobConfig>) => Promise<TBatch<TSource>[]>;
  // Transform the data from the source to the target
  transform: (job: TImportJob<TJobConfig>, data: TSource[], meta: any) => Promise<TTarget[]>;
  // Push the data to the target system
  // Should be a NOOP in case of integrations, and should only be used inside
  // the API, to get the data from the queue and push it to the target system
  push?: (jobId: string, data: TTarget[], meta: any) => Promise<void>;
  // Update the job with the stage and the data
  update?: (jobId: string, stage: UpdateEventType, data: any) => Promise<void>;
}

export interface MigrationController {
  pull: (jobId: string) => Promise<any[]>;
  batches: (jobId: string) => Promise<TBatch<any>[]>;
  transform: (jobId: string, data: any[], meta: any) => Promise<any[]>;
  push: (jobId: string, data: any[], meta: any) => Promise<void>;
  update: (jobId: string, stage: UpdateEventType, data: any) => Promise<void>;
}
