import React from 'react';
import { WorkflowStep } from '../types';

interface WorkflowStepperProps {
  currentStep?: WorkflowStep;
}

const steps: { key: WorkflowStep; code: string; label: string }[] = [
  { key: 'profile', code: '01', label: 'PROFILE' },
  { key: 'understand', code: '02', label: 'UNDERSTAND' },
  { key: 'plan', code: '03', label: 'PLAN' },
  { key: 'simulate', code: '04', label: 'SIMULATE' },
  { key: 'approve', code: '05', label: 'APPROVE' },
  { key: 'clean', code: '06', label: 'CLEAN' },
  { key: 'validate', code: '07', label: 'VALIDATE' },
  { key: 'rollback', code: '08', label: 'ROLLBACK' },
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ currentStep = 'profile' }) => {
  return (
    <div className="bg-white border border-[#3A3A38]/20 p-3 mb-6 select-none">
      <div className="font-mono text-[9px] font-bold text-[#5A5A55] mb-2 uppercase tracking-widest flex items-center justify-between">
        <span>AGENTIC DATA CLEANING LIFECYCLE</span>
        <span className="text-[#1A3C2B]">DETERMINISTIC BOUNDARY VERIFIED</span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
        {steps.map((step) => {
          const isActive = step.key === currentStep;
          return (
            <div
              key={step.key}
              className={`p-2 border text-center transition-colors ${
                isActive
                  ? 'bg-[#1A3C2B] text-white border-[#1A3C2B] font-bold'
                  : 'bg-[#F7F7F5] text-[#5A5A55] border-[#3A3A38]/15'
              }`}
            >
              <span className="font-mono text-[10px] block opacity-75">{step.code}</span>
              <span className="font-mono text-[10px] tracking-wider block font-semibold">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
