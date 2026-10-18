import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { createRef } from 'react';
import { CanvasInlineTextEditor } from '../../components/canvas/CanvasInlineTextEditor';

describe('CanvasInlineTextEditor Component', () => {
  it('returns null if editingTextId or editingTextPos is null', () => {
    const textRef = createRef<HTMLTextAreaElement>();
    const { container, rerender } = render(
      <CanvasInlineTextEditor
        editingTextId={null}
        editingTextPos={{ x: 10, y: 10 }}
        editingTextValue="test"
        onChangeValue={vi.fn()}
        onFinishEditing={vi.fn()}
        color="#000000"
        strokeWidth={2}
        zoom={1}
        pan={{ x: 0, y: 0 }}
        textInputRef={textRef}
      />
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <CanvasInlineTextEditor
        editingTextId="text-1"
        editingTextPos={null}
        editingTextValue="test"
        onChangeValue={vi.fn()}
        onFinishEditing={vi.fn()}
        color="#000000"
        strokeWidth={2}
        zoom={1}
        pan={{ x: 0, y: 0 }}
        textInputRef={textRef}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders textarea with value and triggers onChangeValue and onBlur', () => {
    const textRef = createRef<HTMLTextAreaElement>();
    const onChangeValue = vi.fn();
    const onFinishEditing = vi.fn();

    render(
      <CanvasInlineTextEditor
        editingTextId="text-1"
        editingTextPos={{ x: 100, y: 50 }}
        editingTextValue="Hello World"
        onChangeValue={onChangeValue}
        onFinishEditing={onFinishEditing}
        color="#2563eb"
        strokeWidth={4}
        zoom={1}
        pan={{ x: 0, y: 0 }}
        textInputRef={textRef}
      />
    );

    const textarea = screen.getByTestId('inline-text-input');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Hello World');

    fireEvent.change(textarea, { target: { value: 'Updated Text' } });
    expect(onChangeValue).toHaveBeenCalledWith('Updated Text');

    fireEvent.blur(textarea);
    expect(onFinishEditing).toHaveBeenCalledTimes(1);
  });

  it('finishes editing on Ctrl+Enter and Meta+Enter key combinations', () => {
    const textRef = createRef<HTMLTextAreaElement>();
    const onFinishEditing = vi.fn();

    render(
      <CanvasInlineTextEditor
        editingTextId="text-1"
        editingTextPos={{ x: 100, y: 50 }}
        editingTextValue="Hello World"
        onChangeValue={vi.fn()}
        onFinishEditing={onFinishEditing}
        color="#2563eb"
        strokeWidth={4}
        zoom={1}
        pan={{ x: 0, y: 0 }}
        textInputRef={textRef}
      />
    );

    const textarea = screen.getByTestId('inline-text-input');

    // Regular Enter does not finish (allows multiline)
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: false, metaKey: false });
    expect(onFinishEditing).not.toHaveBeenCalled();

    // Ctrl+Enter finishes
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    expect(onFinishEditing).toHaveBeenCalledTimes(1);

    // Meta+Enter finishes
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
    expect(onFinishEditing).toHaveBeenCalledTimes(2);
  });
});
