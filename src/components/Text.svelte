<svelte:options immutable={true} />

<script>
  import { onMount } from 'svelte';
  import Toolbar from './Toolbar.svelte';
  import { pannable } from '@src/utils/pannable.js';
  import { tapout } from '@src/utils/tapout.js';
  import { timeout } from '@src/utils/helper.js';
  import { Fonts } from '@src/utils/prepareAssets.js';
  import DeleteIcon from '@src/assets/icons/DeleteIcon.svelte';
  import LineHeightIcon from '@src/assets/icons/LineHeightIcon.svelte';
  import TextIcon from '@src/assets/icons/TextIcon.svelte';
  import TextFamilyIcon from '@src/assets/icons/TextFamilyIcon.svelte';
  let { size, text, lineHeight, x, y, fontFamily, pageScale = 1, onupdate, ondelete, onselectfont } = $props();
  const Families = Object.keys(Fonts);
  let startX = $state();
  let startY = $state();
  let editable = $state();
  let _size = $state(size);
  let _lineHeight = $state(lineHeight);
  let _fontFamily = $state(fontFamily);
  let dx = $state(0);
  let dy = $state(0);
  let operation = $state('');
  function handlePanMove(event) {
    dx = (event.detail.x - startX) / pageScale;
    dy = (event.detail.y - startY) / pageScale;
  }

  function handlePanEnd(_event) {
    if (dx === 0 && dy === 0) {
      return editable.focus();
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
  function onFocusTool() {
    operation = 'tool';
  }
  async function onBlurTool() {
    if (operation !== 'tool' || operation === 'edit') return;
    onupdate?.({
      lines: extractLines(),
      lineHeight: _lineHeight,
      size: _size,
      fontFamily: _fontFamily,
    });
    operation = '';
  }
  function sanitize() {
    let weirdNode;
    while ((weirdNode = Array.from(editable.childNodes).find((node) => !['#text', 'BR'].includes(node.nodeName)))) {
      editable.removeChild(weirdNode);
    }
  }
  function onChangeFont() {
    onselectfont?.({
      name: _fontFamily,
    });
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
  function handleDelete() {
    ondelete?.();
  }
  onMount(render);
</script>

{#if operation}
  <Toolbar>
    <div
      use:tapout
      ontapout={onBlurTool}
      onmousedown={onFocusTool}
      ontouchstart={onFocusTool}
      class="h-full flex justify-center items-center bg-gray-300 border-b
      border-gray-400"
    >
      <div class="mr-2 flex items-center">
        <LineHeightIcon class="w-6 h-6 mr-2" />
        <input
          type="number"
          min="1"
          max="10"
          step="0.1"
          class="h-6 w-12 text-center flex-shrink-0 rounded-sm"
          bind:value={_lineHeight}
        />
      </div>
      <div class="mr-2 flex items-center">
        <TextIcon class="w-6 h-6 mr-2" />
        <input
          type="number"
          min="12"
          max="120"
          step="1"
          class="h-6 w-12 text-center flex-shrink-0 rounded-sm"
          bind:value={_size}
        />
      </div>
      <div class="mr-2 flex items-center">
        <TextFamilyIcon class="w-4 h-4 mr-2" />
        <div class="relative w-32 md:w-40">
          <select bind:value={_fontFamily} onchange={onChangeFont} class="font-family">
            {#each Families as family}
              <option value={family}>{family}</option>
            {/each}
          </select>
          <div
            class="pointer-events-none absolute inset-y-0 right-0 flex
            items-center px-2 text-gray-700"
          >
            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path
                d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757
                6.586 4.343 8z"
              />
            </svg>
          </div>
        </div>
      </div>
      <div onclick={handleDelete} class="w-5 h-5 rounded-full bg-white cursor-pointer">
        <DeleteIcon class="w-full h-full text-red-500" />
      </div>
    </div>
  </Toolbar>
{/if}
<div
  use:tapout
  ontapout={onBlur}
  class="absolute left-0 top-0 select-none"
  style="transform: translate({x + dx}px, {y + dy}px);"
>
  <div
    use:pannable={{ onpanstart: handlePanStart, onpanmove: handlePanMove, onpanend: handlePanEnd }}
    class="absolute w-full h-full cursor-grab border border-dotted
    border-gray-500"
    class:cursor-grab={!operation}
    class:cursor-grabbing={operation === 'move'}
    class:editing={['edit', 'tool'].includes(operation)}
  />
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
  .font-family {
    @apply block appearance-none h-6 w-full bg-white pl-2 pr-8 rounded-sm leading-tight;
  }
</style>
