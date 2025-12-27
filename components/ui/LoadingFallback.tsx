import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
      <p className="text-sm text-gray-500">Carregando...</p>
    </div>
  </div>
);

export const ComponentSkeleton: React.FC = () => (
  <div className="space-y-4 p-4">
    <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
    <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
  </div>
);
