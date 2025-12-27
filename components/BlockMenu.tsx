import React from 'react';
import { BlockType } from '../types';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Link,
  Calendar,
  TableIcon,
  Zap,
  Type,
  CheckSquare,
  Minus,
  X,
} from 'lucide-react';
import { Button } from './ui/Button';

interface BlockMenuProps {
  onSelectType: (type: BlockType) => void;
  onClose: () => void;
}

const BlockMenu: React.FC<BlockMenuProps> = ({ onSelectType, onClose }) => {
  const blockOptions = [
    { type: 'paragraph' as BlockType, label: 'Texto', icon: Type, description: 'Parágrafo de texto' },
    { type: 'heading1' as BlockType, label: 'H1', icon: Heading1, description: 'Cabeçalho grande' },
    { type: 'heading2' as BlockType, label: 'H2', icon: Heading2, description: 'Cabeçalho médio' },
    { type: 'heading3' as BlockType, label: 'H3', icon: Heading3, description: 'Cabeçalho pequeno' },
    { type: 'task' as BlockType, label: 'Tarefa', icon: CheckSquare, description: 'Item verificável' },
    { type: 'bulletList' as BlockType, label: 'Lista', icon: List, description: 'Lista com pontos' },
    { type: 'numberedList' as BlockType, label: 'Numerada', icon: ListOrdered, description: 'Lista numerada' },
    { type: 'quote' as BlockType, label: 'Citação', icon: Quote, description: 'Bloco de citação' },
    { type: 'code' as BlockType, label: 'Código', icon: Code, description: 'Bloco de código' },
    { type: 'divider' as BlockType, label: 'Divisor', icon: Minus, description: 'Linha divisória' },
    { type: 'image' as BlockType, label: 'Imagem', icon: Image, description: 'Inserir imagem' },
    { type: 'link' as BlockType, label: 'Link', icon: Link, description: 'Bloco de link' },
    { type: 'event' as BlockType, label: 'Evento', icon: Calendar, description: 'Evento agendado' },
    { type: 'table' as BlockType, label: 'Tabela', icon: TableIcon, description: 'Tabela de dados' },
    { type: 'linkedNote' as BlockType, label: 'Nota Vinculada', icon: Zap, description: 'Referência a outra nota' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Inserir Bloco</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {blockOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.type}
                onClick={() => {
                  onSelectType(option.type);
                  onClose();
                }}
                className="flex flex-col items-center justify-center h-24 p-2 rounded-lg border border-muted hover:bg-primary/10 hover:border-primary transition-all"
              >
                <Icon size={20} className="mb-1 text-primary" />
                <span className="text-xs font-medium text-center">{option.label}</span>
                <span className="text-xs text-muted-foreground text-center line-clamp-1">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BlockMenu;
