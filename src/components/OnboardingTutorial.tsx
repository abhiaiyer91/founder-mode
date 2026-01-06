/**
 * Onboarding Tutorial - Guide new users through their first project
 * 
 * A step-by-step interactive tutorial that appears for new users.
 */

import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import './OnboardingTutorial.css';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlight
  action?: string; // What user needs to do
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  checkComplete?: () => boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Founder Mode! 🎮',
    description: 'You just started your startup journey. Let\'s build something amazing together. This quick tutorial will show you the basics.',
    position: 'center',
  },
  {
    id: 'hire',
    title: 'Step 1: Hire Your First Employee',
    description: 'Click the "Hire" button or press H to open the hiring screen. Every great startup needs a team!',
    target: '[data-tutorial="hire"]',
    action: 'hire',
    position: 'bottom',
  },
  {
    id: 'create-task',
    title: 'Step 2: Create a Task',
    description: 'Now let\'s create some work. Click "Tasks" or press T, then create your first task.',
    target: '[data-tutorial="tasks"]',
    action: 'create-task',
    position: 'bottom',
  },
  {
    id: 'assign-task',
    title: 'Step 3: Assign the Task',
    description: 'Click on an employee, then click on a task to assign it. Watch them start working!',
    action: 'assign',
    position: 'center',
  },
  {
    id: 'watch-progress',
    title: 'Step 4: Watch the Magic ✨',
    description: 'Your AI team is now working! If you have an API key configured, they\'ll generate real code.',
    position: 'center',
  },
  {
    id: 'view-artifacts',
    title: 'Step 5: View Generated Code',
    description: 'Press A to open Artifacts and see all the code, designs, and content your team creates.',
    target: '[data-tutorial="artifacts"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🚀',
    description: 'You now know the basics. Explore missions, the PM advisor, and push your code to GitHub when ready!',
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

  // Check if user has seen tutorial before
  useEffect(() => {
    const seen = localStorage.getItem('founder-mode-tutorial-complete');
    if (seen) {
      setHasSeenTutorial(true);
      setIsVisible(false);
    }
  }, []);

  // Auto-advance based on user actions
  useEffect(() => {
    if (!isVisible) return;

    const step = TUTORIAL_STEPS[currentStep];
    
    // Check step completion conditions
    if (step.id === 'hire' && employees.length > 0) {
      setCurrentStep(2); // Move to create-task
    }
    if (step.id === 'create-task' && tasks.length > 0) {
      setCurrentStep(3); // Move to assign-task
    }
    if (step.id === 'assign-task' && tasks.some(t => t.assigneeId)) {
      setCurrentStep(4); // Move to watch-progress
    }
    if (step.id === 'watch-progress' && tasks.some(t => t.status === 'done' || t.status === 'review')) {
      setCurrentStep(5); // Move to view-artifacts
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

  // Don't show on landing or start screens
  if (!project || screen === 'landing' || screen === 'start' || !isVisible || hasSeenTutorial) {
    return null;
  }

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <>
      {/* Overlay for center-positioned steps */}
      {step.position === 'center' && (
        <div className="tutorial-overlay" onClick={handleSkip} />
      )}

      <div className={`tutorial-popup position-${step.position}`}>
        {/* Progress bar */}
        <div className="tutorial-progress">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Content */}
        <div className="tutorial-content">
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </div>

        {/* Actions */}
        <div className="tutorial-actions">
          <button className="skip-btn" onClick={handleSkip}>
            Skip Tutorial
          </button>
          <div className="tutorial-nav">
            <span className="step-counter">
              {currentStep + 1} / {TUTORIAL_STEPS.length}
            </span>
            <button className="next-btn" onClick={handleNext}>
              {isLastStep ? 'Get Started!' : 'Next →'}
            </button>
          </div>
        </div>

        {/* Pointer arrow for targeted steps */}
        {step.target && step.position !== 'center' && (
          <div className={`tutorial-arrow arrow-${step.position}`} />
        )}
      </div>
    </>
  );
}

// Hook to reset tutorial (for testing)
export function useResetTutorial() {
  return () => {
    localStorage.removeItem('founder-mode-tutorial-complete');
    window.location.reload();
  };
}

export default OnboardingTutorial;
