import { Block, BlockType } from '../types';

export const generateId = () => crypto.randomUUID();

export const createBlock = (type: BlockType, content: string = ''): Block => ({
  id: generateId(),
  type,
  content,
  order: 0,
  metadata: {},
});

export const insertBlock = (blocks: Block[], index: number, block: Block): Block[] => {
  const newBlocks = [...blocks];
  newBlocks.splice(index, 0, { ...block, order: index });
  // Update order for all blocks after insertion
  return newBlocks.map((b, i) => ({ ...b, order: i }));
};

export const removeBlock = (blocks: Block[], blockId: string): Block[] => {
  return blocks
    .filter(b => b.id !== blockId)
    .map((b, i) => ({ ...b, order: i }));
};

export const moveBlock = (blocks: Block[], fromIndex: number, toIndex: number): Block[] => {
  const newBlocks = [...blocks];
  const [movedBlock] = newBlocks.splice(fromIndex, 1);
  newBlocks.splice(toIndex, 0, movedBlock);
  return newBlocks.map((b, i) => ({ ...b, order: i }));
};

export const updateBlock = (blocks: Block[], blockId: string, updates: Partial<Block>): Block[] => {
  return blocks.map(b => 
    b.id === blockId ? { ...b, ...updates } : b
  );
};

export const getBlockIndex = (blocks: Block[], blockId: string): number => {
  return blocks.findIndex(b => b.id === blockId);
};

export const blocksToHtml = (blocks: Block[]): string => {
  return blocks
    .sort((a, b) => a.order - b.order)
    .map(block => {
      switch (block.type) {
        case 'paragraph':
          return `<p>${block.content}</p>`;
        case 'heading1':
          return `<h1>${block.content}</h1>`;
        case 'heading2':
          return `<h2>${block.content}</h2>`;
        case 'heading3':
          return `<h3>${block.content}</h3>`;
        case 'bulletList':
          return `<ul><li>${block.content}</li></ul>`;
        case 'numberedList':
          return `<ol><li>${block.content}</li></ol>`;
        case 'quote':
          return `<blockquote>${block.content}</blockquote>`;
        case 'code':
          return `<pre><code>${block.content}</code></pre>`;
        case 'divider':
          return '<hr />';
        case 'task':
          return `<li data-type="taskItem" data-checked="${block.metadata?.checked ? 'true' : 'false'}">${block.content}</li>`;
        default:
          return block.content;
      }
    })
    .join('');
};

export const htmlToBlocks = (html: string): Block[] => {
  // Simplified conversion - in production would need more robust parsing
  const blocks: Block[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  let order = 0;
  doc.body.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      blocks.push({
        id: generateId(),
        type: 'paragraph',
        content: node.textContent,
        order: order++,
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      let type: BlockType = 'paragraph';
      
      switch (element.tagName.toLowerCase()) {
        case 'h1': type = 'heading1'; break;
        case 'h2': type = 'heading2'; break;
        case 'h3': type = 'heading3'; break;
        case 'blockquote': type = 'quote'; break;
        case 'pre': type = 'code'; break;
        case 'hr': type = 'divider'; break;
        case 'ul': type = 'bulletList'; break;
        case 'ol': type = 'numberedList'; break;
      }
      
      blocks.push({
        id: generateId(),
        type,
        content: element.innerHTML,
        order: order++,
      });
    }
  });
  
  return blocks;
};
