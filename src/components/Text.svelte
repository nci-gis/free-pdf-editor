<svelte:options immutable={true} />

<script>
  import { onMount } from 'svelte';
  import { pannable } from '@src/utils/pannable.js';
  import { tapout } from '@src/utils/tapout.js';
  import { timeout } from '@src/utils/helper.js';
  let { id, size, text, lineHeight, x, y, fontFamily, pageScale = 1, isSelected = false, onupdate, ondelete, onselect } = $props();
  let startX = $state();
  let startY = $state();
  let editable = $state();
  let _size = $state(size);
  let _lineHeight = $state(lineHeight);
  let _fontFamily = $state(fontFamily);
  let dx = $state(0);
  let dy = $state(0);
  let operation = $state('');

  // Sync props to local state when they change from sidebar
  $effect(() => {
    _size = size;
    _lineHeight = lineHeight;
    _fontFamily = fontFamily;
  });
  function handlePanMove(event) {
    dx = (event.detail.x - startX) / pageScale;
    dy = (event.detail.y - startY) / pageScale;
  }

  function handlePanEnd(_event) {
    if (dx === 0 && dy === 0) {
      editable.focus();
      return;
    }
    onupdate?.({
      x: x + dx,
      y: y + dy,
    });
    dx = 0;
    dy = 0;
    operation = '';
  }
  function handlePanStart(event) {
    startX = event.detail.x;
    startY = event.detail.y;
    operation = 'move';
    // Select this component when starting to interact
    onselect?.({ id });
  }
  function onFocus() {
    operation = 'edit';
  }
  async function onBlur() {
    if (operation !== 'edit' || operation === 'tool') return;
    editable.blur();
    sanitize();
    onupdate?.({
      lines: extractLines(),
      width: editable.clientWidth,
    });
    operation = '';
  }
  async function onPaste(e) {
    // get text only
    const pastedText = e.clipboardData.getData('text');
    document.execCommand('insertHTML', false, pastedText);
    // await tick() is not enough
    await timeout();
    sanitize();
  }
  function onKeydown(e) {
    const childNodes = Array.from(editable.childNodes);
    if (e.keyCode === 13) {
      // prevent default adding div behavior
      e.preventDefault();
      const selection = window.getSelection();
      const focusNode = selection.focusNode;
      const focusOffset = selection.focusOffset;
      // the caret is at an empty line
      if (focusNode === editable) {
        editable.insertBefore(document.createElement('br'), childNodes[focusOffset]);
      } else if (focusNode instanceof HTMLBRElement) {
        editable.insertBefore(document.createElement('br'), focusNode);
      }
      // the caret is at a text line but not end
      else if (focusNode.textContent.length !== focusOffset) {
        document.execCommand('insertHTML', false, '<br>');
        // the carat is at the end of a text line
      } else {
        let br = focusNode.nextSibling;
        if (br) {
          editable.insertBefore(document.createElement('br'), br);
        } else {
          br = editable.appendChild(document.createElement('br'));
          br = editable.appendChild(document.createElement('br'));
        }
        // set selection to new line
        selection.collapse(br, 0);
      }
    }
  }
  function handleSelect(e) {
    e.stopPropagation();
    onselect?.({ id });
  }
  function sanitize() {
    let weirdNode;
    while ((weirdNode = Array.from(editable.childNodes).find((node) => !['#text', 'BR'].includes(node.nodeName)))) {
      editable.removeChild(weirdNode);
    }
  }
  function render() {
    editable.innerHTML = text;
    editable.focus();
  }
  function extractLines() {
    const nodes = editable.childNodes;
    const lines = [];
    let lineText = '';
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      if (node.nodeName === 'BR') {
        lines.push(lineText);
        lineText = '';
      } else {
        lineText += node.textContent;
      }
    }
    lines.push(lineText);
    return lines;
  }
  onMount(render);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events, element_invalid_self_closing_tag -->
<div
  onclick={handleSelect}
  use:tapout
  ontapout={onBlur}
  class="absolute left-0 top-0 select-none"
  class:ring-2={isSelected}
  class:ring-blue-500={isSelected}
  style="transform: translate({x + dx}px, {y + dy}px);"
>
  <div
    use:pannable={{ onpanstart: handlePanStart, onpanmove: handlePanMove, onpanend: handlePanEnd }}
    class="absolute w-full h-full cursor-grab border border-dotted"
    class:border-blue-500={isSelected}
    class:border-gray-500={!isSelected}
    class:cursor-grab={!operation}
    class:cursor-grabbing={operation === 'move'}
    class:editing={operation === 'edit'}
  ></div>
  <div
    bind:this={editable}
    onfocus={onFocus}
    onkeydown={onKeydown}
    onpaste={(event) => {
      event.preventDefault();
      onPaste(event);
    }}
    contenteditable="true"
    spellcheck="false"
    class="outline-none whitespace-no-wrap"
    style="font-size: {_size}px; font-family: '{_fontFamily}', serif;
    line-height: {_lineHeight}; -webkit-user-select: text;"
  />
</div>

<style>
  @reference "tailwindcss";

  .editing {
    @apply pointer-events-none border-gray-800 border-dashed;
  }
</style>
