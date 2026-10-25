// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { h } from '../../webview/dom';

describe('h', () => {
  it('builds elements with attributes, listeners and children', () => {
    let clicks = 0;
    const el = h('button', { class: 'btn', 'data-x': 1, hidden: false, onclick: () => clicks++ }, 'Go ', h('b', {}, 2), null);
    el.click();
    expect(el.outerHTML).toBe('<button class="btn" data-x="1">Go <b>2</b></button>');
    expect(clicks).toBe(1);
  });
});
