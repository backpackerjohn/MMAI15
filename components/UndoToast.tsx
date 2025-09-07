import React, { useEffect, useState } from 'react';
import { UndoAction } from '../types';
import UndoIcon from './icons/UndoIcon';

interface UndoToastProps {
  action: UndoAction | null;
  onUndo: () => void;
  onDismiss: () => void;
}

const UndoToast: React.FC<UndoToastProps> = ({ action, onUndo, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (action) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Allow fade-out
      }, 5000); // 5 seconds to undo

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [action, onDismiss]);

  const handleUndoClick = () => {
    onUndo();
  };

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-[var(--color-surface)] rounded-xl elevation-3 p-4 w-full max-w-md flex items-center gap-4">
        <UndoIcon className="h-6 w-6 text-[var(--color-primary-accent)] flex-shrink-0" />
        <p className="text-sm font-semibold text-[var(--color-text-primary)] flex-1">{action?.message}</p>
        <button
          onClick={handleUndoClick}
          className="px-3 py-1.5 text-sm font-bold text-[var(--color-primary-accent)] hover:bg-[var(--color-surface-sunken)] rounded-md border border-[var(--color-border)]"
        >
          Undo
        </button>
      </div>
    </div>
  );
};

export default UndoToast;
