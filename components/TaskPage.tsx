import React, { useState, useMemo } from 'react';
import { SavedTask, SubStep, UndoAction } from '../types';
import TrashIcon from './icons/TrashIcon';

interface TaskPageProps {
  savedTasks: SavedTask[];
  setSavedTasks: React.Dispatch<React.SetStateAction<SavedTask[]>>;
  onResume: (task: SavedTask) => void;
  onUndo: (props: Omit<UndoAction, 'id'>) => void;
}

const TaskPage: React.FC<TaskPageProps> = ({ savedTasks, setSavedTasks, onResume, onUndo }) => {
  type SortOption = 'Most Recent' | 'Finish Line' | 'Unfinished Only';
  const [sortBy, setSortBy] = useState<SortOption>('Most Recent');
  const [editingTask, setEditingTask] = useState<{ id: string; note: string; nickname: string } | null>(null);

  const sortedTasks = useMemo(() => {
    let tasks = [...savedTasks];
    
    if (sortBy === 'Unfinished Only') {
      tasks = tasks.filter(t => t.progress.completedSubSteps < t.progress.totalSubSteps);
    }

    switch (sortBy) {
      case 'Most Recent':
        return tasks.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      case 'Finish Line':
        return tasks.sort((a, b) => (a.nickname || a.mapData.finishLine.statement).localeCompare(b.nickname || b.mapData.finishLine.statement));
      default:
        return tasks;
    }
  }, [savedTasks, sortBy]);

  const handleDelete = (taskId: string) => {
    const taskToDelete = savedTasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    const originalTasks = [...savedTasks];
    setSavedTasks(tasks => tasks.filter(t => t.id !== taskId));
    
    onUndo({
        message: `Deleted "${taskToDelete.nickname || taskToDelete.mapData.finishLine.statement}"`,
        onUndo: () => {
            setSavedTasks(originalTasks);
        }
    });
  };
  
  const handleSaveEdit = () => {
    if (!editingTask) return;
    setSavedTasks(tasks => tasks.map(t => t.id === editingTask.id ? { ...t, note: editingTask.note, nickname: editingTask.nickname } : t));
    setEditingTask(null);
  };
  
  const handleResume = (task: SavedTask) => {
      const nextMove = findNextBestMove(task);
      // alert(`Resumed: ${task.nickname || task.mapData.finishLine.statement}. Next - ${nextMove ? nextMove.description : 'Final review!'}`);
      onResume(task);
  };

  const findNextBestMove = (task: SavedTask): SubStep | null => {
    for (const chunk of task.mapData.chunks) {
        if (!chunk.isComplete) {
            for (const subStep of chunk.subSteps) {
                if (!subStep.isComplete && !subStep.isBlocked) {
                    return subStep;
                }
            }
        }
    }
    return null;
  };

  const renderTaskCard = (task: SavedTask) => {
    const isEditing = editingTask?.id === task.id;
    const nextBestMove = findNextBestMove(task);
    const progressPercentage = task.progress.totalSubSteps > 0 ? (task.progress.completedSubSteps / task.progress.totalSubSteps) * 100 : 0;
    
    return (
      <div key={task.id} className="relative bg-[var(--color-surface)] rounded-xl elevation-2 flex flex-col transition-all duration-300 card-interactive-lift card-gradient-overlay-clay">
        <div className="relative z-10 p-6 flex flex-col flex-1">
          {isEditing ? (
              <div className="flex-1">
                  <input
                      type="text"
                      value={editingTask.nickname}
                      onChange={(e) => setEditingTask({ ...editingTask, nickname: e.target.value })}
                      placeholder="Add a nickname..."
                      className="w-full text-xl font-bold text-[var(--color-text-primary)] border-b-2 border-dashed border-[var(--color-border-hover)] focus:border-[var(--color-primary-accent)] focus:outline-none pb-1 bg-transparent"
                  />
                  <textarea
                      value={editingTask.note}
                      onChange={(e) => setEditingTask({ ...editingTask, note: e.target.value })}
                      className="w-full mt-2 text-sm text-[var(--color-text-secondary)] bg-transparent border border-dashed border-[var(--color-border)] rounded-md p-2 h-24 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-accent)]"
                  />
              </div>
          ) : (
              <div className="flex-1">
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                      {task.nickname || task.mapData.finishLine.statement}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{task.note}</p>
              </div>
          )}
          
          <div className="mt-4 pt-4 inset-divider">
              {nextBestMove ? (
                  <div>
                      <p className="text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider mb-1">Next Best Move</p>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{nextBestMove.description}</p>
                  </div>
              ) : (
                  <p className="text-sm font-medium text-green-600">This task is complete!</p>
              )}
          </div>

          <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-[var(--color-text-subtle)]">Progress</span>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">{task.progress.completedSubSteps} / {task.progress.totalSubSteps}</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2">
                  <div className="bg-[var(--color-success)] h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
              </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface-sunken)]/60 px-6 py-3 rounded-b-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
              {isEditing ? (
                  <>
                      <button onClick={handleSaveEdit} className="text-sm font-bold text-[var(--color-primary-accent)]">Save</button>
                      <button onClick={() => setEditingTask(null)} className="text-sm font-semibold text-[var(--color-text-secondary)]">Cancel</button>
                  </>
              ) : (
                 <>
                  <button onClick={() => handleResume(task)} className="text-sm font-bold text-[var(--color-primary-accent)]">Resume</button>
                  <button onClick={() => setEditingTask({ id: task.id, note: task.note, nickname: task.nickname || '' })} className="text-sm font-semibold text-[var(--color-text-secondary)]">Edit</button>
                 </>
              )}
          </div>
          <button onClick={() => handleDelete(task.id)} className="text-stone-400 hover:text-red-500" title="Delete Task">
              <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <main className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">Saved Tasks</h1>
            <p className="text-[var(--color-text-secondary)] mt-2">Resume a past Momentum Map or review your completed projects.</p>
        </div>
        <div className="flex items-center space-x-2 p-1 bg-[var(--color-surface-sunken)] rounded-lg">
          {(['Most Recent', 'Finish Line', 'Unfinished Only'] as SortOption[]).map(option => (
            <button key={option} onClick={() => setSortBy(option)} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${sortBy === option ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-primary-accent)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}>
              {option}
            </button>
          ))}
        </div>
      </div>
      
      {sortedTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTasks.map(renderTaskCard)}
        </div>
      ) : (
        <div className="text-center py-20 bg-[var(--color-surface)] rounded-2xl elevation-2">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">No Saved Tasks Yet</h2>
            <p className="text-[var(--color-text-secondary)] mt-2">When you save a Momentum Map, you'll find it here.</p>
        </div>
      )}
    </main>
  );
};

export default TaskPage;