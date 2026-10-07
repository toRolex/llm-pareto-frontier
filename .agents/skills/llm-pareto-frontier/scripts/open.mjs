#!/usr/bin/env node
// open.mjs — 用系统默认浏览器打开 prototype-4d-3d.html（4D 版唯一产出）。
// 永不 throw：无 GUI 浏览器或打开失败时打印 file:// 路径兜底。

import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(HERE, '..', 'prototype-4d-3d.html');

if (!existsSync(HTML)) {
  console.error(`prototype-4d-3d.html not found: ${HTML} — 先跑 build-proto.mjs`);
  process.exit(1);
}

const url = 'file://' + HTML;
const cmd = process.platform === 'darwin' ? 'open'
  : process.platform === 'win32' ? 'cmd'
  : 'xdg-open';
const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];

const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
child.on('error', () => console.log(url)); // 无 GUI / 命令缺失 → 打印路径兜底
child.unref();
console.log(`opened: ${url}`);
