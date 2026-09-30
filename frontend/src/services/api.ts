import axios from 'axios';
import { supabase } from './supabase';
import {
  HealthStatus,
  Dataset,
  DatasetProfile,
  SemanticAnalysisResponse,
  CleaningPlanResponse,
  TransformationPlanItem,
  PlanPreviewResponse,
  ExecutionResponse,
  ValidationReportResponse,
  DatasetHistoryResponse,
  RollbackResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to dynamically attach Supabase Bearer token from existing session
apiClient.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (e) {
    // If fetching session fails, proceed with request (backend will handle unauthenticated error)
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const apiService = {
  getHealth: async (): Promise<HealthStatus> => {
    const response = await apiClient.get<HealthStatus>('/health');
    return response.data;
  },

  uploadDataset: async (file: File): Promise<Dataset> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<Dataset>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  listDatasets: async (): Promise<Dataset[]> => {
    const response = await apiClient.get<Dataset[]>('/datasets');
    return response.data;
  },

  getDataset: async (id: string): Promise<Dataset> => {
    const response = await apiClient.get<Dataset>(`/datasets/${id}`);
    return response.data;
  },

  getProfile: async (id: string): Promise<DatasetProfile> => {
    const response = await apiClient.get<DatasetProfile>(`/profile/${id}`);
    return response.data;
  },

  analyzeDataset: async (id: string): Promise<SemanticAnalysisResponse> => {
    const response = await apiClient.post<SemanticAnalysisResponse>(`/analyze/${id}`);
    return response.data;
  },

  getAnalysis: async (id: string): Promise<SemanticAnalysisResponse> => {
    const response = await apiClient.get<SemanticAnalysisResponse>(`/analyze/${id}`);
    return response.data;
  },

  createCleaningPlan: async (datasetId: string, selectedTransformations?: TransformationPlanItem[]): Promise<CleaningPlanResponse> => {
    const body = selectedTransformations ? { selected_transformations: selectedTransformations } : undefined;
    const response = await apiClient.post<CleaningPlanResponse>(`/plan/${datasetId}`, body);
    return response.data;
  },

  getCleaningPlan: async (datasetId: string): Promise<CleaningPlanResponse> => {
    const response = await apiClient.get<CleaningPlanResponse>(`/plan/${datasetId}`);
    return response.data;
  },

  previewCleaningPlan: async (datasetId: string): Promise<PlanPreviewResponse> => {
    const response = await apiClient.post<PlanPreviewResponse>(`/preview/${datasetId}`);
    return response.data;
  },

  approveCleaningPlan: async (planId: string): Promise<CleaningPlanResponse> => {
    const response = await apiClient.post<CleaningPlanResponse>(`/plan/${planId}/approve`);
    return response.data;
  },

  rejectCleaningPlan: async (planId: string): Promise<CleaningPlanResponse> => {
    const response = await apiClient.post<CleaningPlanResponse>(`/plan/${planId}/reject`);
    return response.data;
  },

  executeCleaningPlan: async (datasetId: string): Promise<ExecutionResponse> => {
    const response = await apiClient.post<ExecutionResponse>(`/execute/${datasetId}`);
    return response.data;
  },

  getValidation: async (datasetId: string): Promise<ValidationReportResponse> => {
    const response = await apiClient.get<ValidationReportResponse>(`/validation/${datasetId}`);
    return response.data;
  },

  getHistory: async (datasetId: string): Promise<DatasetHistoryResponse> => {
    const response = await apiClient.get<DatasetHistoryResponse>(`/history/${datasetId}`);
    return response.data;
  },

  rollbackDataset: async (datasetId: string, targetVersion: number, reason?: string): Promise<RollbackResponse> => {
    const response = await apiClient.post<RollbackResponse>(`/rollback/${datasetId}`, {
      target_version: targetVersion,
      reason
    });
    return response.data;
  },

  getDownloadUrl: (datasetId: string, version?: number): string => {
    const query = version !== undefined ? `?version=${version}` : '';
    return `${API_BASE_URL}/download/${datasetId}${query}`;
  }
};
