import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import core from './locales/zh-CN/core';
import organize from './locales/zh-CN/organize';
import messages from './locales/zh-CN/messages';

const catalog = { ...core, ...organize, ...messages };
const sourceRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const filesUnder = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });

const sourceFiles = filesUnder(sourceRoot).filter(path =>
  /\.tsx?$/.test(path) && !path.endsWith('.test.ts') && !path.endsWith('.test.tsx'));

describe('Chinese translation catalog', () => {
  it('preserves all interpolation placeholders', () => {
    const placeholders = (value: string): string[] =>
      [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
    for (const [source, translated] of Object.entries(catalog)) {
      expect(translated.trim(), source).not.toBe('');
      expect(placeholders(translated), source).toEqual(placeholders(source));
    }
  });

  it('covers every static t() key in application code', () => {
    const missing: string[] = [];
    for (const path of sourceFiles) {
      const tree = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
      const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't') {
          const key = node.arguments[0];
          if (key && ts.isStringLiteral(key) && !Object.prototype.hasOwnProperty.call(catalog, key.text)) {
            missing.push(`${path}: ${key.text}`);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(tree);
    }
    expect(missing).toEqual([]);
  });

  it('does not leave visible English JSX copy outside translations', () => {
    const untranslated: string[] = [];
    const brandText = /^(?:MarkMind(?: v)?|GitHub|English)$/;
    for (const path of sourceFiles.filter(file => file.endsWith('.tsx'))) {
      const tree = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node): void => {
        if (ts.isJsxText(node)) {
          const text = node.text.replace(/\s+/g, ' ').trim();
          if (/[A-Za-z]/.test(text) && !brandText.test(text)) untranslated.push(`${path}: ${text}`);
        }
        ts.forEachChild(node, visit);
      };
      visit(tree);
    }
    expect(untranslated).toEqual([]);
  });
});
