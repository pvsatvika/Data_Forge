export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  environment: string;
}

export interface Dataset {
  id: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  sha256: string;
  upload_timestamp: string;
  status: string;
  profile_status: string;
  row_count?: number;
  column_count?: number;
}

export interface SemanticHints {
  likely_identifier: boolean;
  likely_email: boolean;
  likely_phone: boolean;
  likely_date: boolean;
  likely_numeric: boolean;
  likely_categorical: boolean;
  likely_boolean: boolean;
}

export interface ColumnProfile {
  column_name: string;
  inferred_type: string;
  null_count: number;
  null_percentage: number;
  unique_count: number;
  unique_percentage: number;
  duplicate_count: number;
  sample_values: unknown[];
  min_val?: unknown;
  max_val?: unknown;
  mean_val?: number;
  median_val?: number;
  semantic_hints: SemanticHints;
}

export interface DatasetProfile {
  dataset_id: string;
  row_count: number;
  column_count: number;
  duplicate_row_count: number;
  duplicate_row_percentage: number;
  columns: ColumnProfile[];
}

export interface InferredConstraint {
  column: string;
  constraint_type: string;
  description: string;
  confidence: number;
}

export interface CleaningRecommendation {
  column: string;
  operation: string;
  reason: string;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  parameters?: Record<string, unknown>;
}

export interface AnalysisWarning {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface SemanticAnalysisResponse {
  analysis_id: string;
  dataset_id: string;
  model_used: string;
  dataset_summary: string;
  inferred_constraints: InferredConstraint[];
  recommendations: CleaningRecommendation[];
  warnings: AnalysisWarning[];
  analyzed_at: string;
}

export interface TransformationPlanItem {
  column: string;
  operation: string;
  reason: string;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  parameters?: Record<string, unknown>;
}

export interface RiskSummary {
  low_count: number;
  medium_count: number;
  high_count: number;
  requires_approval: boolean;
}

export interface TransformationStats {
  operation: string;
  column: string;
  affected_rows: number;
  changed_cells: number;
  nulls_created: number;
  rows_removed: number;
}

export interface CellDiffRecord {
  row_index: number;
  column_name: string;
  old_value?: string | null;
  new_value?: string | null;
  operation: string;
}

export interface InformationLossSummary {
  original_row_count: number;
  simulated_row_count: number;
  rows_affected: number;
  rows_removed: number;
  cells_changed: number;
  values_nullified: number;
  columns_affected: string[];
  estimated_loss_score: number;
}

export interface CleaningPlanResponse {
  plan_id: string;
  dataset_id: string;
  analysis_id?: string;
  status: string;
  transformations: TransformationPlanItem[];
  risk_summary: RiskSummary;
  created_at: string;
  approved_at?: string;
}

export interface PlanPreviewResponse {
  plan_id: string;
  dataset_id: string;
  status: string;
  risk_summary: RiskSummary;
  loss_summary: InformationLossSummary;
  transformation_stats: TransformationStats[];
  cell_diffs: CellDiffRecord[];
  diff_truncated: boolean;
}

export interface CleaningOperation {
  column: string;
  operation: 
    | 'trim_whitespace'
    | 'lowercase'
    | 'uppercase'
    | 'normalize_email'
    | 'normalize_phone'
    | 'fill_missing'
    | 'replace_values'
    | 'convert_type'
    | 'normalize_dates'
    | 'remove_duplicates';
  reason: string;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  parameters: Record<string, unknown>;
}

export interface CleaningPlan {
  plan_id: string;
  dataset_id: string;
  operations: CleaningOperation[];
  created_at: string;
  requires_approval: boolean;
}

export interface InformationLossReport {
  plan_id: string;
  rows_affected: number;
  cells_changed: number;
  rows_removed: number;
  values_nullified: number;
  columns_affected: string[];
  estimated_loss_score: number;
}

export interface ValidationReport {
  plan_id: string;
  status: 'PASS' | 'FAIL';
  checks_run: number;
  passed_checks: number;
  failed_checks: number;
  details: Array<Record<string, unknown>>;
}

export type WorkflowStep =
  | 'profile'
  | 'understand'
  | 'plan'
  | 'simulate'
  | 'approve'
  | 'clean'
  | 'validate'
  | 'rollback';

export interface ExecutionResponse {
  dataset_id: string;
  version_number: number;
  row_count: number;
  column_count: number;
  file_path: string;
  sha256: string;
  execution_status: string;
  validation_status: 'PASS' | 'WARN' | 'FAIL';
  executed_at: string;
}

export interface ValidationCheckItem {
  check_name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  severity: 'low' | 'medium' | 'high' | 'critical';
  expected: string;
  actual: string;
  message: string;
}

export interface ValidationReportResponse {
  validation_id: string;
  dataset_id: string;
  plan_id: string;
  overall_status: 'PASS' | 'WARN' | 'FAIL';
  executed_at: string;
  checks: ValidationCheckItem[];
}

export interface VersionItem {
  version_id: string;
  dataset_id: string;
  version_number: number;
  row_count: number;
  column_count: number;
  sha256: string;
  is_active: boolean;
  created_at: string;
  pipeline_id?: string;
}

export interface DatasetHistoryResponse {
  dataset_id: string;
  current_version: number;
  versions: VersionItem[];
}

export interface RollbackRequest {
  target_version: number;
  reason?: string;
}

export interface RollbackResponse {
  dataset_id: string;
  previous_version: number;
  current_version: number;
  message: string;
  rolled_back_at: string;
}

