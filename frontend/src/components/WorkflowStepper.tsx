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
    <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 p-3.5 mb-6 select-none transition-colors duration-150 rounded-xl shadow-sm">
      <div className="font-mono text-[9px] font-bold text-[#6E6966] dark:text-[#9E9793] mb-2 uppercase tracking-widest flex items-center justify-between">
        <span>AGENTIC DATA CLEANING LIFECYCLE</span>
        <span className="text-[#7E454B]">DETERMINISTIC BOUNDARY VERIFIED</span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
        {steps.map((step) => {
          const isActive = step.key === currentStep;
          return (
            <div
              key={step.key}
              className={`p-2 border text-center transition-colors rounded-lg ${
                isActive
                  ? 'bg-[#7E454B] text-white border-[#7E454B] font-bold shadow-sm'
                  : 'bg-[#EFECE6] dark:bg-[#121114] text-[#6E6966] dark:text-[#9E9793] border-[#E5E0D8] dark:border-white/10'
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

