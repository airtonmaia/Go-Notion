# Sistema de Blocos - Notion-like Editor

## Visão Geral

O sistema de blocos permite criar e editar notas de forma modular, similar ao Notion. Cada nota pode ter uma série de blocos que podem ser rearrajados através de drag-and-drop.

## Componentes

### BlockRenderer.tsx
Renderiza um bloco individual com suporte a:
- Edição inline de conteúdo
- Drag-and-drop para reordenação
- Ações contextuais (duplicar, adicionar, deletar)
- 15 tipos diferentes de blocos

**Props:**
- `block`: Objeto Block com tipo, conteúdo e metadados
- `isSelected`: Se o bloco está selecionado
- `onUpdate`: Callback quando conteúdo muda
- `onDelete`: Callback para deletar o bloco
- `onDuplicate`: Callback para duplicar o bloco
- `onAddBlock`: Callback para adicionar novo bloco
- `onDragStart/Over/Drop`: Handlers para drag-and-drop
- `isEditable`: Se o bloco pode ser editado (padrão: true)

### BlockEditor.tsx
Gerencia a lista completa de blocos:
- Renderiza BlockRenderer para cada bloco
- Gerencia seleção e foco
- Suporta inserção de novos blocos
- Coordena drag-and-drop entre blocos

**Props:**
- `blocks`: Array de Block
- `onBlocksChange`: Callback quando blocos são modificados
- `onAddBlock`: Callback opcional para adicionar bloco

### BlockMenu.tsx
Modal para seleção de tipo de bloco com 15 opções:
- Texto
- Cabeçalhos (H1, H2, H3)
- Tarefa (checkbox)
- Listas (com bullets ou numeradas)
- Citação
- Código
- Divisor
- Imagem
- Link
- Evento (com data/hora)
- Tabela
- Nota Vinculada

## Tipos de Blocos Suportados

```typescript
type BlockType = 
  | 'paragraph'
  | 'heading1' | 'heading2' | 'heading3'
  | 'task'
  | 'bulletList' | 'numberedList'
  | 'quote'
  | 'code'
  | 'divider'
  | 'image'
  | 'link'
  | 'event'
  | 'table'
  | 'linkedNote';

interface Block {
  id: string;
  type: BlockType;
  content: string;
  order: number;
  metadata: Record<string, any>;
}
```

## Usando no Editor

O Editor agora suporta tanto Tiptap quanto BlockEditor:

```typescript
// Ativa BlockEditor quando a nota tem blocos
if (note.blocks && note.blocks.length > 0) {
  <BlockEditor 
    blocks={blocks}
    onBlocksChange={(updatedBlocks) => {
      onUpdate({...note, blocks: updatedBlocks});
    }}
  />
}
```

## Funcionalidades

### Edição de Blocos
- Click em um bloco para selecioná-lo
- Digite para editar conteúdo
- Use TAB para navegar entre blocos
- Cada tipo tem renderer especializado

### Reordenação
- Passe o mouse sobre um bloco para ver o ícone de drag
- Arraste para reposicionar
- Ordem é atualizada automaticamente

### Ações Rápidas
- **Duplicar** (+): Cria cópia exata do bloco
- **Adicionar** (⊕): Insere novo bloco após o atual
- **Deletar** (🗑️): Remove o bloco

### Inserir Novos Blocos
- Clique no botão "Adicionar bloco" no topo ou entre blocos
- Selecione o tipo na modal
- Bloco é criado vazio, pronto para edição

## Integração com Supabase

Os blocos são salvos no campo `blocks` da nota:

```typescript
interface Note {
  ...
  blocks?: Block[];  // Novo campo para blocos
  content: string;   // Mantém compatibilidade com Tiptap
}
```

A migração pode ser feita incrementalmente:
- Notas antigas continuam usando `content` (Tiptap)
- Notas novas ou convertidas usam `blocks`
- Sistema híbrido funciona perfeitamente

## Recursos Futuros

- [ ] Sincronização em tempo real com Supabase
- [ ] Colaboração simultânea
- [ ] Histórico de versões para blocos individuais
- [ ] Templates de blocos
- [ ] Carregamento lazy de blocos grandes
- [ ] Markdown para criação rápida de blocos
