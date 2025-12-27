import React, { useRef, useEffect, useState } from 'react';
import { Block, BlockType } from '../types';
import { GripVertical, Trash2, Copy, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from './ui/utils';

interface BlockRendererProps {
  block: Block;
  index: number;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
  onUpdate: (blockId: string, content: string, metadata?: Record<string, any>) => void;
  onDelete: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
  onAddBlock: (index: number, type?: BlockType) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isEditable?: boolean;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  index,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddBlock,
  onDragStart,
  onDragOver,
  onDrop,
  isEditable = true,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleContentChange = (newContent: string) => {
    onUpdate(block.id, newContent);
  };

  const handleTaskToggle = () => {
    const newChecked = !(block.metadata?.checked || false);
    onUpdate(block.id, block.content, { ...block.metadata, checked: newChecked });
  };

  const renderBlockContent = () => {
    const baseClasses = "outline-none focus:ring-2 focus:ring-primary/50 rounded px-1";
    
    switch (block.type) {
      case 'heading1':
        return (
          <h1
            contentEditable={isEditable}
            suppressContentEditableWarning
            onInput={(e) => handleContentChange(e.currentTarget.innerText)}
            onBlur={(e) => handleContentChange(e.currentTarget.innerText)}
            className={cn("text-3xl font-bold", baseClasses)}
          >
            {block.content || 'Cabeçalho...'}
          </h1>
        );
      case 'heading2':
        return (
          <h2
            contentEditable={isEditable}
            suppressContentEditableWarning
            onInput={(e) => handleContentChange(e.currentTarget.innerText)}
            onBlur={(e) => handleContentChange(e.currentTarget.innerText)}
            className={cn("text-2xl font-bold", baseClasses)}
          >
            {block.content || 'Cabeçalho 2...'}
          </h2>
        );
      case 'heading3':
        return (
          <h3
            contentEditable={isEditable}
            suppressContentEditableWarning
            onInput={(e) => handleContentChange(e.currentTarget.innerText)}
            onBlur={(e) => handleContentChange(e.currentTarget.innerText)}
            className={cn("text-xl font-bold", baseClasses)}
          >
            {block.content || 'Cabeçalho 3...'}
          </h3>
        );
      case 'task':
        return (
          <div className="flex items-center gap-3 p-2">
            <input
              type="checkbox"
              checked={block.metadata?.checked || false}
              onChange={handleTaskToggle}
              disabled={!isEditable}
              className="h-5 w-5 cursor-pointer disabled:opacity-50"
            />
            <div
              contentEditable={isEditable}
              suppressContentEditableWarning
              onInput={(e) => handleContentChange(e.currentTarget.innerText)}
              onBlur={(e) => handleContentChange(e.currentTarget.innerText)}
              className={cn(
                "flex-1",
                baseClasses,
                block.metadata?.checked && "line-through text-muted-foreground"
              )}
            >
              {block.content || 'Nova tarefa...'}
            </div>
          </div>
        );
      case 'quote':
        return (
          <blockquote
            contentEditable={isEditable}
            suppressContentEditableWarning
            onInput={(e) => handleContentChange(e.currentTarget.innerText)}
            onBlur={(e) => handleContentChange(e.currentTarget.innerText)}
            className={cn("border-l-4 border-primary/50 pl-4 italic", baseClasses)}
          >
            {block.content || 'Citação...'}
          </blockquote>
        );
      case 'code':
        return (
          <pre
            contentEditable={isEditable}
            suppressContentEditableWarning
            onInput={(e) => handleContentChange(e.currentTarget.innerText)}
            onBlur={(e) => handleContentChange(e.currentTarget.innerText)}
            className={cn("bg-muted p-3 rounded font-mono text-sm overflow-x-auto", baseClasses)}
          >
            <code>{block.content || 'Código...'}</code>
          </pre>
        );
      case 'divider':
        return <hr className="my-4 border-muted-foreground/30" />;
      case 'bulletList':
        return (
          <ul className="ml-6">
            <li
              contentEditable={isEditable}
              suppressContentEditableWarning
              onInput={(e) => handleContentChange(e.currentTarget.innerText)}
              onBlur={(e) => handleContentChange(e.currentTarget.innerText)}
              className={baseClasses}
            >
              {block.content || 'Item...'}
            </li>
          </ul>
        );
      case 'numberedList':
        return (
          <ol className="ml-6">
            <li
              contentEditable={isEditable}
              suppressContentEditableWarning
              onInput={(e) => handleContentChange(e.currentTarget.innerText)}
              onBlur={(e) => handleContentChange(e.currentTarget.innerText)}
              className={baseClasses}
            >
              {block.content || 'Item...'}
            </li>
          </ol>
        );
      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="URL da imagem..."
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              disabled={!isEditable}
              className={cn(
                "w-full px-2 py-1 border rounded text-sm disabled:opacity-50",
                baseClasses
              )}
            />
            {block.content && (
              <img
                src={block.content}
                alt="Bloco de imagem"
                className="max-w-full rounded border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
        );
      case 'link':
        return (
          <div className="space-y-1">
            <input
              type="url"
              placeholder="URL..."
              value={block.metadata?.url || ''}
              onChange={(e) => onUpdate(block.id, block.content, { ...block.metadata, url: e.target.value })}
              disabled={!isEditable}
              className={cn(
                "w-full px-2 py-1 border rounded text-sm disabled:opacity-50",
                baseClasses
              )}
            />
            <div
              contentEditable={isEditable}
              suppressContentEditableWarning
              onInput={(e) => handleContentChange(e.currentTarget.innerText)}
              onBlur={(e) => handleContentChange(e.currentTarget.innerText)}
              className={cn("text-blue-500 underline", baseClasses)}
            >
              {block.content || 'Texto do link...'}
            </div>
          </div>
        );
      case 'event':
        return (
          <div className="space-y-2 p-2 bg-primary/5 rounded border border-primary/20">
            <input
              type="datetime-local"
              value={block.metadata?.datetime || ''}
              onChange={(e) => onUpdate(block.id, block.content, { ...block.metadata, datetime: e.target.value })}
              disabled={!isEditable}
              className={cn("w-full px-2 py-1 border rounded text-sm disabled:opacity-50", baseClasses)}
            />
            <div
              contentEditable={isEditable}
              suppressContentEditableWarning
              onInput={(e) => handleContentChange(e.currentTarget.innerText)}
              onBlur={(e) => handleContentChange(e.currentTarget.innerText)}
              className={baseClasses}
            >
              {block.content || 'Descrição do evento...'}
            </div>
          </div>
        );
      case 'linkedNote':
        return (
          <div className="p-3 bg-muted rounded border border-dashed">
            <input
              type="text"
              placeholder="ID ou título da nota..."
              value={block.metadata?.noteId || ''}
              onChange={(e) => onUpdate(block.id, block.content, { ...block.metadata, noteId: e.target.value })}
              disabled={!isEditable}
              className={cn("w-full px-2 py-1 border rounded text-sm disabled:opacity-50 mb-2", baseClasses)}
            />
            <div className="text-xs text-muted-foreground">{block.content || 'Nota vinculada'}</div>
          </div>
        );
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-muted">
              <tbody>
                <tr>
                  <td className="border p-2">
                    <div
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onInput={(e) => handleContentChange(e.currentTarget.innerText)}
                      onBlur={(e) => handleContentChange(e.currentTarget.innerText)}
                      className={cn("min-h-8", baseClasses)}
                    >
                      {block.content || 'Dado...'}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      default:
        return (
          <div
            contentEditable={isEditable}
            suppressContentEditableWarning
            onInput={(e) => handleContentChange(e.currentTarget.innerText)}
            onBlur={(e) => handleContentChange(e.currentTarget.innerText)}
            className={cn("text-base min-h-6", baseClasses)}
          >
            {block.content || 'Escreva algo...'}
          </div>
        );
    }
  };

  return (
    <div
      ref={contentRef}
      draggable={isEditable}
      onDragStart={(e) => {
        setIsDragging(true);
        onDragStart(e, index);
      }}
      onDragEnd={() => setIsDragging(false)}
      onDragOver={onDragOver}
      onDrop={(e) => {
        onDrop(e, index);
        setIsDragging(false);
      }}
      onClick={() => onSelect(block.id)}
      className={cn(
        "group relative flex items-start gap-2 p-3 rounded-lg transition-all border-2",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:border-muted",
        isDragging && "opacity-50 bg-muted"
      )}
    >
      {/* Drag Handle */}
      {isEditable && (
        <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVertical size={16} className="text-muted-foreground" />
        </div>
      )}

      {/* Block Content */}
      <div className="flex-1 min-w-0">
        {renderBlockContent()}
      </div>

      {/* Action Buttons */}
      {isEditable && (
        <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(block.id);
            }}
            title="Duplicar"
          >
            <Copy size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onAddBlock(index + 1);
            }}
            title="Adicionar bloco"
          >
            <Plus size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(block.id);
            }}
            title="Deletar"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default BlockRenderer;
