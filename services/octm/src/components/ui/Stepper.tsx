'use client';

import { useEffect, useRef } from 'react';

import { Button, MobileStepper } from './base';

type StepperProps = {
  steps: number;
  activeStep: number;
  onChange: (step: number) => void;
  disabled?: boolean;
};

export const Stepper = ({
  steps,
  activeStep,
  onChange,
  disabled = false,
}: StepperProps) => {
  const lastStep = steps - 1;

  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveStepRef = useRef(activeStep);

  useEffect(() => {
    const previous = previousActiveStepRef.current;

    if (steps > 1) {
      if (activeStep === 0 && previous > 0) {
        nextButtonRef.current?.focus();
      } else if (activeStep === lastStep && previous < lastStep) {
        backButtonRef.current?.focus();
      }
    }

    previousActiveStepRef.current = activeStep;
  }, [activeStep, lastStep, steps]);

  return (
    <MobileStepper
      variant="progress"
      steps={steps}
      position="static"
      activeStep={activeStep}
      sx={{ width: '100%', maxWidth: 400, flexGrow: 1 }}
      slotProps={{
        progress: { 'aria-label': 'stepper linear progress' },
      }}
      nextButton={
        <Button
          size="small"
          onClick={() => onChange(activeStep + 1)}
          disabled={disabled || activeStep >= lastStep}
          ref={nextButtonRef}
        >
          Next
        </Button>
      }
      backButton={
        <Button
          size="small"
          onClick={() => onChange(activeStep - 1)}
          disabled={disabled || activeStep <= 0}
          ref={backButtonRef}
        >
          Back
        </Button>
      }
    />
  );
};
