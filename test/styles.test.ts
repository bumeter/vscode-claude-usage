import { describe, expect, it } from 'vitest';
import { STYLE_IDS } from '@bumeter/vscode-kit/styles';
import pkg from '../package.json';
import { styleList, styleSetting } from '../src/styles';

describe('styles', () => {
  it('the picker lists every style of the kit, named in both languages', () => {
    for (const lang of ['vi', 'en'] as const) {
      const list = styleList(lang);
      expect(list.map((s) => s.id)).toEqual([...STYLE_IDS]);
      expect(list.every((s) => s.name && s.description)).toBe(true);
    }
  });

  it('the setting offers the same styles, plus custom, each with a description', () => {
    const p = pkg.contributes.configuration.properties['claudeUsage.style'];
    expect(p.enum).toEqual([...STYLE_IDS, 'custom']);
    expect(p.enumDescriptions).toHaveLength(p.enum.length);
  });

  it('an unknown setting value falls back to classic', () => {
    expect([styleSetting('bars'), styleSetting('custom'), styleSetting('nope'), styleSetting(undefined)]).toEqual(['bars', 'custom', 'classic', 'classic']);
  });
});
