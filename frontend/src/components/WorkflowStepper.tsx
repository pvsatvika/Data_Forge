import React from 'react';
import { WorkflowStep } from '../types';

interface WorkflowStepperProps {
  currentStep?: WorkflowStep;
}

const steps: { key: WorkflowStep; label: string }[] = [
  { key: 'profile', label: 'PROFILE' },
  { key: 'understand', label: 'UNDERSTAND' },
  { key: 'plan', label: 'PLAN' },
  { key: 'simulate', label: 'SIMULATE' },
  { key: 'approve', label: 'APPROVE' },
  { key: 'clean', label: 'CLEAN' },
  { key: 'validate', label: 'VALIDATE' },
  { key: 'rollback', label: 'ROLLBACK' },
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ currentStep = 'profile' }) => {
  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 mb-6">
      <div className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">
        Agentic Execution Pipeline Lifecycle
      </div>
      <div className="flex items-center justify-between overflow-x-auto gap-2 pb-2">
        {steps.map((step, idx) => {
          const isActive = step.key === currentStep;
          return (
            <React.Fragment key={step.key}>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 ring-2 ring-sky-400/50'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-xs font-semibold tracking-wide ${
                    isActive ? 'text-sky-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="h-0.5 w-6 bg-slate-700 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
