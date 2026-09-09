"use client";

export interface WizardStepDef {
  step: number;
  label: string;
}

interface StepIndicatorProps {
  steps: WizardStepDef[];
  currentStep: number;
  maxReachedStep: number;
  onNavigate: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, maxReachedStep, onNavigate }: StepIndicatorProps) {
  return (
    <nav aria-label="Progreso del asistente">
      <ol className="step-indicator">
        {steps.map(({ step, label }) => {
          const state = step === currentStep ? "active" : step < currentStep ? "done" : "pending";
          const reachable = step <= maxReachedStep;
          return (
            <li key={step} data-state={state}>
              <button
                type="button"
                onClick={() => reachable && onNavigate(step)}
                disabled={!reachable}
                aria-current={step === currentStep ? "step" : undefined}
              >
                <span className="step-number" aria-hidden="true">
                  {step}
                </span>
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
