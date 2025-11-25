
import React from 'react';
import { ProjectTask } from '../types';
import { Layers, FileVideo, Image as ImageIcon, Clock } from 'lucide-react';

interface ProductCardProps {
  task: ProjectTask;
  onClick: () => void;
  isActive: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ task, onClick, isActive }) => {
  
  const completedCount = task.concepts.filter(c => c.state.status === 'COMPLETED').length;
  const totalConcepts = task.concepts.length;
  
  const getStatusColor = () => {
    if (task.status === 'QUEUED') return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
    if (task.status === 'EXECUTING') return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
    if (task.status === 'READY') return 'text-indigo-400 border-indigo-500/50 bg-indigo-500/10';
    if (completedCount > 0 && completedCount === totalConcepts) return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
    return 'text-slate-400 border-slate-700 bg-slate-800/50';
  };

  return (
    <button 
      onClick={onClick}
      className={`
        relative w-full text-left p-4 rounded-xl border transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-indigo-500
        ${isActive ? 'ring-1 ring-indigo-500 bg-slate-800 border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-slate-700'}
        ${task.status === 'QUEUED' ? 'opacity-70 grayscale-[0.5]' : ''}
      `}
      aria-pressed={isActive}
      aria-label={`Select project ${task.input.name}, status ${task.status}`}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700 relative group-hover:border-slate-600 transition-colors">
          {task.input.images && task.input.images.length > 0 ? (
            <img src={task.input.images[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <ImageIcon size={24} />
            </div>
          )}
          {task.input.images && task.input.images.length > 1 && (
            <div className="absolute bottom-0 right-0 bg-black/80 text-[10px] text-white px-1.5 py-0.5 rounded-tl-md font-bold backdrop-blur-sm">
                +{task.input.images.length - 1}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold truncate transition-colors ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
            {task.input.name}
          </h3>
          <p className="text-xs text-slate-400 truncate mt-1 group-hover:text-slate-300">
            {task.concepts.length > 0 ? `${totalConcepts} Concepts` : (task.status === 'QUEUED' ? 'Waiting in Queue...' : 'Drafting...')}
          </p>
          
          <div className={`mt-3 flex items-center gap-2 text-[10px] px-2 py-1 rounded-md w-fit border ${getStatusColor()}`}>
            {task.status === 'BRAINSTORMING' ? (
                <Layers className="w-3 h-3 animate-bounce" />
            ) : task.status === 'QUEUED' ? (
                <Clock className="w-3 h-3" />
            ) : (
                <FileVideo className="w-3 h-3" />
            )}
            <span className="font-bold tracking-wide uppercase">
                {task.status === 'DRAFT' && 'DRAFT'}
                {task.status === 'QUEUED' && 'QUEUED'}
                {task.status === 'BRAINSTORMING' && 'ANALYZING'}
                {(task.status === 'READY' || task.status === 'EXECUTING') && (
                    completedCount === totalConcepts ? 'COMPLETED' : `${completedCount}/${totalConcepts} DONE`
                )}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default ProductCard;
