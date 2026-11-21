import assert from 'node:assert/strict';
import test from 'node:test';
import { imageSize } from './imageSize.ts';

test('a header webp reports its pixel size', () => {
  assert.deepEqual(imageSize('/images/header/smithville.webp'), { width: 1024, height: 341 });
});

test('a missing or remote path does not invent a size', () => {
  assert.equal(imageSize('/images/news/does-not-exist.jpg'), undefined);
  assert.equal(imageSize('https://example.test/a.jpg'), undefined);
  assert.equal(imageSize('/images/../../etc/passwd'), undefined);
});
