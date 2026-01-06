/**
 * Onboarding Tutorial - Guide new users through their first project
 */

import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import './OnboardingTutorial.css';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  action?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  checkComplete?: () => boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Founder Mode',
    description: 'Your startup journey begins now. This quick tutorial will show you the basics.',
    position: 'center',
  },
  {
    id: 'hire',
    title: 'Hire Your First Employee',
    description: 'Click "Hire" or press H to open the hiring screen. Every startup needs a team.',
    target: '[data-tutorial="hire"]',
    action: 'hire',
    position: 'bottom',
  },
  {
    id: 'create-task',
    title: 'Create a Task',
    description: 'Click "Tasks" or press T, then create your first task for the team.',
    target: '[data-tutorial="tasks"]',
    action: 'create-task',
    position: 'bottom',
  },
  {
    id: 'assign-task',
    title: 'Assign the Task',
    description: 'Click on an employee, then click on a task to assign it. Watch them start working.',
    action: 'assign',
    position: 'center',
  },
  {
    id: 'watch-progress',
    title: 'Watch the Progress',
    description: 'Your AI team is now working. With an API key configured, they generate real code.',
    position: 'center',
  },
  {
    id: 'view-artifacts',
    title: 'View Generated Code',
    description: 'Press A to open Artifacts and see all the code your team creates.',
    target: '[data-tutorial="artifacts"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re Ready',
    description: 'You know the basics. Explore missions, the PM advisor, and push to GitHub when ready.',
    position: 'center',
  },
];

export function OnboardingTutorial() {
  const { 
    employees, 
    tasks, 
    project,
    screen,
  } = useGameStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('founder-mode-tutorial-complete');
    if (seen) {
      setHasSeenTutorial(true);
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const step = TUTORIAL_STEPS[currentStep];
    
    if (step.id === 'hire' && employees.length > 0) {
      setCurrentStep(2);
    }
    if (step.id === 'create-task' && tasks.length > 0) {
      setCurrentStep(3);
    }
    if (step.id === 'assign-task' && tasks.some(t => t.assigneeId)) {
      setCurrentStep(4);
    }
    if (step.id === 'watch-progress' && tasks.some(t => t.status === 'done' || t.status === 'review')) {
      setCurrentStep(5);
    }
  }, [currentStep, employees.length, tasks, isVisible]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handleSkip = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    localStorage.setItem('founder-mode-tutorial-complete', 'true');
    setHasSeenTutorial(true);
    setIsVisible(false);
  };

  if (!project || screen === 'landing' || screen === 'start' || screen === 'projects' || !isVisible || hasSeenTutorial) {
    return null;
  }

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <>
      {step.position === 'center' && (
        <div className="tutorial-overlay" />
      )}

      <div className={`tutorial-popup position-${step.position}`}>
        <div className="tutorial-header">
          <span className="tutorial-step-badge">
            {currentStep + 1} of {TUTORIAL_STEPS.length}
          </span>
          <button className="tutorial-close" onClick={handleSkip}>×</button>
        </div>

        <div className="tutorial-content">
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </div>

        <div className="tutorial-actions">
          <button className="tutorial-skip" onClick={handleSkip}>
            Skip
          </button>
          <button className="tutorial-next" onClick={handleNext}>
            {isLastStep ? 'Get Started' : 'Next'} →
          </button>
        </div>

        {step.target && step.position !== 'center' && (
          <div className={`tutorial-arrow arrow-${step.position}`} />
        )}
      </div>
    </>
  );
}

export function useResetTutorial() {
  return () => {
    localStorage.removeItem('founder-mode-tutorial-complete');
    window.location.reload();
  };
}

export default OnboardingTutorial;
