import React, { useState, useCallback } from 'react';
import { Block, BlockType } from '../types';
import { generateId } from '../services/blocks';
import BlockRenderer from './BlockRenderer';
import BlockMenu from './BlockMenu';
import { Button } from './ui/Button';
import { Plus } from 'lucide-react';

interface BlockEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  onAddBlock?: (type: BlockType) => void;
}

const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onBlocksChange, onAddBlock }) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleUpdateBlock = useCallback(
    (blockId: string, content: string, metadata?: Record<string, any>) => {
      const updatedBlocks = blocks.map((b) =>
        b.id === blockId ? { ...b, content, metadata: { ...b.metadata, ...metadata } } : b
      );
      onBlocksChange(updatedBlocks);
    },
    [blocks, onBlocksChange]
  );

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      if (blocks.length === 1) {
        // Don't delete the last block, just clear it
        const updatedBlocks = blocks.map((b) =>
          b.id === blockId ? { ...b, content: '' } : b
        );
        onBlocksChange(updatedBlocks);
        return;
      }

      const updatedBlocks = blocks.filter((b) => b.id !== blockId);
      onBlocksChange(updatedBlocks);
      setSelectedBlockId(null);
    },
    [blocks, onBlocksChange]
  );

  const handleDuplicateBlock = useCallback(
    (blockId: string) => {
      const blockIndex = blocks.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) return;

      const blockToDuplicate = blocks[blockIndex];
      const newBlock: Block = {
        ...blockToDuplicate,
        id: generateId(),
        order: blockIndex + 1,
      };

      const updatedBlocks = [...blocks];
      updatedBlocks.splice(blockIndex + 1, 0, newBlock);

      // Reorder all blocks
      updatedBlocks.forEach((b, i) => (b.order = i));
      onBlocksChange(updatedBlocks);
    },
    [blocks, onBlocksChange]
  );

  const handleAddBlock = useCallback(
    (index: number, type?: BlockType) => {
      setMenuIndex(index);
      if (type) {
        handleInsertBlock(index, type);
      } else {
        setShowBlockMenu(true);
      }
    },
    []
  );

  const handleInsertBlock = useCallback(
    (index: number, type: BlockType) => {
      const newBlock: Block = {
        id: generateId(),
        type,
        content: '',
        order: index,
        metadata: {},
      };

      const updatedBlocks = [...blocks];
      updatedBlocks.splice(index, 0, newBlock);

      // Reorder all blocks
      updatedBlocks.forEach((b, i) => (b.order = i));
      onBlocksChange(updatedBlocks);
      setShowBlockMenu(false);
      setSelectedBlockId(newBlock.id);
    },
    [blocks, onBlocksChange]
  );

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updatedBlocks = [...blocks];
    const [draggedBlock] = updatedBlocks.splice(draggedIndex, 1);
    updatedBlocks.splice(dropIndex, 0, draggedBlock);

    // Reorder all blocks
    updatedBlocks.forEach((b, i) => (b.order = i));
    onBlocksChange(updatedBlocks);
    setDraggedIndex(null);
  };

  // Create initial block if empty
  React.useEffect(() => {
    if (blocks.length === 0) {
      const initialBlock: Block = {
        id: generateId(),
        type: 'paragraph',
        content: '',
        order: 0,
        metadata: {},
      };
      onBlocksChange([initialBlock]);
    }
  }, []);

  return (
    <div className="space-y-2">
      {/* Add Block Button - Top */}
      <div className="flex justify-center mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddBlock(0)}
          className="text-xs"
        >
          <Plus size={14} className="mr-1" />
          Adicionar bloco
        </Button>
      </div>

      {/* Blocks List */}
      <div className="space-y-1">
        {blocks.map((block, index) => (
          <div key={block.id}>
            <BlockRenderer
              block={block}
              index={index}
              isSelected={selectedBlockId === block.id}
              onSelect={setSelectedBlockId}
              onUpdate={handleUpdateBlock}
              onDelete={handleDeleteBlock}
              onDuplicate={handleDuplicateBlock}
              onAddBlock={handleAddBlock}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />

            {/* Add Block Button - Between Blocks */}
            {index < blocks.length - 1 && (
              <div className="flex justify-center py-1 opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddBlock(index + 1)}
                  className="text-xs h-6 px-2"
                >
                  <Plus size={12} className="mr-1" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Add Block Button - End */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddBlock(blocks.length)}
            className="text-xs"
          >
            <Plus size={14} className="mr-1" />
            Novo bloco
          </Button>
        </div>
      </div>

      {/* Block Menu Modal */}
      {showBlockMenu && (
        <BlockMenu
          onSelectType={(type) => {
            if (menuIndex !== null) {
              handleInsertBlock(menuIndex, type);
            }
          }}
          onClose={() => setShowBlockMenu(false)}
        />
      )}
    </div>
  );
};

export default BlockEditor;
