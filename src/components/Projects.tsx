import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '../lib/supabase';
import { StudyCategory } from './StudySessionForm';

export type ProjectType = 'progress' | 'time';

export interface Project {
  id: string;
  userId: string;
  title: string;
  category: StudyCategory;
  type: ProjectType;
  unitName: string | null;
  goal: number | null;
  currentProgress: number | null;
  totalTimeMinutes: number;
  createdAt: string;
  archivedAt: string | null;
  sortOrder: number;
  resourceUrl: string | null;
}

interface ProjectsProps {
  userId: string;
  error: string | null;
  onError: (error: string | null) => void;
  onSessionLogged: () => void;
}

const categories: StudyCategory[] = ['Games & analysis', 'Tactics', 'Endgame', 'Middlegame', 'Openings'];

function NewProjectForm({ userId, onSuccess, onCancel }: { userId: string; onSuccess: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<StudyCategory>('Games & analysis');
  const [type, setType] = useState<ProjectType>('time');
  const [unitName, setUnitName] = useState('');
  const [goal, setGoal] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Project title is required');
      return;
    }

    if (type === 'progress') {
      if (!unitName.trim()) {
        setError('Unit name is required for progress-based projects');
        return;
      }
      if (!goal || Number(goal) <= 0) {
        setError('Goal must be a positive number');
        return;
      }
    }

    setIsSubmitting(true);
    const { error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        title: title.trim(),
        category,
        type,
        unit_name: type === 'progress' ? unitName.trim() : null,
        goal: type === 'progress' ? Number(goal) : null,
        current_progress: type === 'progress' ? 0 : null,
        created_at: new Date().toISOString(),
        resource_url: resourceUrl.trim() || null,
      });

    setIsSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-700 bg-secondary p-4">
      <h3 className="font-semibold">Create New Project</h3>

      <div>
        <label htmlFor="project-title" className="mb-2 block text-sm font-medium text-gray-300">
          Project Title
        </label>
        <input
          id="project-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Read My System"
          className="w-full rounded border border-gray-700 bg-primary px-3 py-2 text-white focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="project-category" className="mb-2 block text-sm font-medium text-gray-300">
          Category
        </label>
        <select
          id="project-category"
          value={category}
          onChange={e => setCategory(e.target.value as StudyCategory)}
          className="w-full rounded border border-gray-700 bg-primary px-3 py-2 text-white focus:border-accent focus:outline-none"
        >
          {categories.map(opt => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Project Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="time"
              checked={type === 'time'}
              onChange={() => setType('time')}
              className="cursor-pointer"
            />
            <span className="text-sm text-gray-300">Time-based (no finish line)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="progress"
              checked={type === 'progress'}
              onChange={() => setType('progress')}
              className="cursor-pointer"
            />
            <span className="text-sm text-gray-300">Progress-based (measurable goal)</span>
          </label>
        </div>
      </div>

      {type === 'progress' && (
        <>
          <div>
            <label htmlFor="project-unit" className="mb-2 block text-sm font-medium text-gray-300">
              Unit Name
            </label>
            <input
              id="project-unit"
              type="text"
              value={unitName}
              onChange={e => setUnitName(e.target.value)}
              placeholder="e.g., pages, chapters, puzzles"
              className="w-full rounded border border-gray-700 bg-primary px-3 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="project-goal" className="mb-2 block text-sm font-medium text-gray-300">
              Goal
            </label>
            <input
              id="project-goal"
              type="number"
              min="1"
              step="1"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="e.g., 60"
              className="w-full rounded border border-gray-700 bg-primary px-3 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="project-resource" className="mb-2 block text-sm font-medium text-gray-300">
          Resource URL <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          id="project-resource"
          type="url"
          value={resourceUrl}
          onChange={e => setResourceUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded border border-gray-700 bg-primary px-3 py-2 text-white focus:border-accent focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded bg-accent py-2 font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Project'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded bg-gray-700 py-2 font-semibold text-white transition hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function LogSessionForm({
  project,
  userId,
  onSuccess,
  onCancel,
}: {
  project: Project;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [timeMinutes, setTimeMinutes] = useState('30');
  const [progress, setProgress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const time = Number(timeMinutes);
    if (!Number.isFinite(time) || time <= 0) {
      setError('Time must be a positive number');
      return;
    }

    if (project.type === 'progress') {
      const prog = Number(progress);
      if (!Number.isFinite(prog) || prog <= 0) {
        setError('Progress must be a positive number');
        return;
      }
    }

    setIsSubmitting(true);
    const createdAt = new Date().toISOString();

    try {
      // Insert study session
      const formattedNotes = notes.trim() ? `[Project: ${project.title}] ${notes.trim()}` : `[Project: ${project.title}]`;
      const { error: insertError } = await supabase.from('study_sessions').insert({
        user_id: userId,
        category: project.category,
        duration_minutes: time,
        notes: formattedNotes,
        created_at: createdAt,
      });

      if (insertError) {
        setError(insertError.message);
        setIsSubmitting(false);
        return;
      }

      // Update project progress if needed
      if (project.type === 'progress') {
        const newProgress = (project.currentProgress || 0) + Number(progress);
        const { error: updateError } = await supabase
          .from('projects')
          .update({ current_progress: newProgress })
          .eq('id', project.id);

        if (updateError) {
          setError(updateError.message);
          setIsSubmitting(false);
          return;
        }
      }

      setIsSubmitting(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-gray-700 bg-secondary p-3">
      <h4 className="text-sm font-semibold">Log Session</h4>

      <div>
        <label htmlFor="log-time" className="mb-1 block text-xs font-medium text-gray-300">
          Time Spent (minutes)
        </label>
        <input
          id="log-time"
          type="number"
          min="1"
          step="1"
          required
          value={timeMinutes}
          onChange={e => setTimeMinutes(e.target.value)}
          className="w-full rounded border border-gray-700 bg-primary px-2 py-1 text-sm text-white focus:border-accent focus:outline-none"
        />
      </div>

      {project.type === 'progress' && (
        <div>
          <label htmlFor="log-progress" className="mb-1 block text-xs font-medium text-gray-300">
            Progress ({project.unitName})
          </label>
          <input
            id="log-progress"
            type="number"
            min="1"
            step="1"
            required
            value={progress}
            onChange={e => setProgress(e.target.value)}
            className="w-full rounded border border-gray-700 bg-primary px-2 py-1 text-sm text-white focus:border-accent focus:outline-none"
          />
        </div>
      )}

      <div>
        <label htmlFor="log-notes" className="mb-1 block text-xs font-medium text-gray-300">
          Notes <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          id="log-notes"
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="What did you work on?"
          className="w-full resize-none rounded border border-gray-700 bg-primary px-2 py-1 text-sm text-white focus:border-accent focus:outline-none"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded bg-accent py-1.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Logging...' : 'Log Session'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded bg-gray-700 py-1.5 text-sm font-semibold text-white transition hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ProjectCard({
  project,
  userId,
  onUpdate,
  onError,
  isDragging,
  dragHandleProps,
}: {
  project: Project;
  userId: string;
  onUpdate: () => void;
  onError: (err: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const progressPercent = project.type === 'progress' && project.goal ? Math.min(100, (project.currentProgress || 0) / project.goal * 100) : 0;

  async function handleArchive() {
    if (!window.confirm('Archive this project?')) {
      return;
    }

    setIsArchiving(true);
    const { error } = await supabase
      .from('projects')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', project.id);

    setIsArchiving(false);

    if (error) {
      onError(error.message);
      return;
    }

    onUpdate();
  }

  async function handleDelete() {
    setShowDeleteConfirm(false);
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id)
      .eq('user_id', userId);

    if (error) {
      onError(error.message);
      return;
    }

    onUpdate();
  }

  function extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  }

  return (
    <div 
      className={`rounded-lg border border-gray-800 bg-primary p-4 transition-opacity ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Drag Handle */}
      <div 
  {...dragHandleProps}
  className="flex shrink-0 items-center px-2 text-gray-600 hover:text-gray-300 cursor-grab active:cursor-grabbing transition"
  style={{ touchAction: 'none' }}
  title="Drag to reorder"
>
          <span className="text-lg leading-none">⠿</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-semibold text-white">{project.title}</h3>
            <span className="text-xs uppercase tracking-wider text-gray-400">
              {project.category}
            </span>
          </div>

          {project.resourceUrl && (
            <p className="mt-1">
              <a
                href={project.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 underline transition hover:text-white"
              >
                {extractDomain(project.resourceUrl)}
              </a>
            </p>
          )}

          {project.type === 'progress' && project.goal && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">Progress</span>
                <span className="text-xs text-gray-400">
                  {project.currentProgress || 0} / {project.goal} {project.unitName}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full bg-gray-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            Total time logged: <span className="text-gray-400">{project.totalTimeMinutes} min</span>
          </p>

          {showDeleteConfirm && (
            <p className="mt-3 flex items-center gap-2 text-xs text-red-400">
              Delete project?
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="text-red-400 underline transition hover:text-red-300"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 underline transition hover:text-gray-300"
              >
                Cancel
              </button>
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => setShowLogForm(!showLogForm)}
            className="whitespace-nowrap rounded border border-gray-600 px-3 py-1.5 text-sm text-white bg-transparent transition hover:bg-gray-700"
          >
            {showLogForm ? 'Cancel' : 'Log'}
          </button>

          <div className="flex gap-1 text-sm">
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-gray-500 transition hover:text-red-400"
              >
                Delete
              </button>
            )}
            {project.type === 'progress' && progressPercent >= 100 && (
              <button
                type="button"
                onClick={() => void handleArchive()}
                disabled={isArchiving}
                className="text-gray-500 transition hover:text-white disabled:opacity-50"
              >
                {isArchiving ? 'Archiving...' : 'Archive'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showLogForm && (
        <div className="mt-4">
          <LogSessionForm
            project={project}
            userId={userId}
            onSuccess={() => {
              setShowLogForm(false);
              onUpdate();
            }}
            onCancel={() => setShowLogForm(false)}
          />
        </div>
      )}
    </div>
  );
}

function SortableProjectCard(props: React.ComponentProps<typeof ProjectCard> & { id: string }) {
  const { id, ...otherProps } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ProjectCard
        {...otherProps}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function Projects({ userId, error, onError, onSessionLogged }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

 const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  }),
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);

  useEffect(() => {
    void fetchProjects();
  }, [userId]);

  async function fetchProjects() {
    setIsLoading(true);
    onError(null);

    const { data, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id, title, category, type, unit_name, goal, current_progress, created_at, archived_at, sort_order, resource_url')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('sort_order', { ascending: true });

    if (fetchError) {
      onError(fetchError.message);
      setIsLoading(false);
      return;
    }

    // Fetch all sessions for the user to calculate time per project
    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('category, duration_minutes')
      .eq('user_id', userId);

    // Create a map of category -> total minutes
    const timeByCategory: Record<string, number> = {};
    if (!sessionsError && sessions) {
      sessions.forEach(session => {
        timeByCategory[session.category] = (timeByCategory[session.category] || 0) + session.duration_minutes;
      });
    }

    // Build projects with time data
    const projectsWithTime = (data || []).map(project => ({
      id: project.id,
      userId: project.user_id,
      title: project.title,
      category: project.category as StudyCategory,
      type: project.type as ProjectType,
      unitName: project.unit_name,
      goal: project.goal,
      currentProgress: project.current_progress,
      totalTimeMinutes: timeByCategory[project.category] || 0,
      createdAt: project.created_at,
      archivedAt: project.archived_at,
      sortOrder: project.sort_order,
      resourceUrl: project.resource_url,
    }));

    setProjects(projectsWithTime);
    setIsLoading(false);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = projects.findIndex(p => p.id === active.id);
    const newIndex = projects.findIndex(p => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update local state
    const newProjects = arrayMove(projects, oldIndex, newIndex);
    setProjects(newProjects);

    // Update sort_order for all affected projects
    const updates = newProjects.map((project, index) =>
      supabase.from('projects').update({ sort_order: index }).eq('id', project.id)
    );

    const results = await Promise.all(updates);
    if (results.some(r => r.error)) {
      onError('Failed to reorder projects');
      // Revert to previous state on error
      await fetchProjects();
      return;
    }

    // Refresh to confirm changes
    await fetchProjects();
  }

  if (isLoading) {
    return null;
  }

  if (projects.length === 0 && !showNewForm) {
    return (
      <section className="mb-8">
        {showNewForm && (
          <div className="mb-4">
            <NewProjectForm
              userId={userId}
              onSuccess={() => {
                setShowNewForm(false);
                void fetchProjects();
              }}
              onCancel={() => setShowNewForm(false)}
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          className="text-sm text-gray-400 underline transition hover:text-gray-300"
        >
          + New Project
        </button>
      </section>
    );
  }

  return (
    <section className="mb-8">
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-700 px-5 py-8 text-center text-sm text-gray-400">
          No active projects. Create one to get started!
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={projects.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {projects.map((project) => (
                <SortableProjectCard
                  key={project.id}
                  id={project.id}
                  project={project}
                  userId={userId}
                  onUpdate={() => {
                    void fetchProjects();
                    onSessionLogged();
                  }}
                  onError={onError}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showNewForm && (
        <div className="mt-6">
          <NewProjectForm
            userId={userId}
            onSuccess={() => {
              setShowNewForm(false);
              void fetchProjects();
              onSessionLogged();
            }}
            onCancel={() => setShowNewForm(false)}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowNewForm(!showNewForm)}
        className="mt-6 text-sm text-gray-400 underline transition hover:text-gray-300"
      >
        {showNewForm ? 'Cancel' : '+ New Project'}
      </button>
    </section>
  );
}
