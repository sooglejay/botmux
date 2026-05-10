/**
 * Tests for `findInheritablePeer` — the helper that decides whether a newly
 * created session can reuse a sibling's workingDir (and skip the repo card).
 *
 * Run:  pnpm vitest run test/inherit-peer.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindByRoot = vi.fn();
const mockFindByChat = vi.fn();

vi.mock('../src/services/session-store.js', () => ({
  findActiveSessionsByRoot: (...args: unknown[]) => mockFindByRoot(...args),
  findActiveChatScopeSessionsByChat: (...args: unknown[]) => mockFindByChat(...args),
}));

import { findInheritablePeer } from '../src/core/inherit-peer.js';

function makePeer(overrides: Partial<{ sessionId: string; rootMessageId: string; chatId: string; scope: 'thread' | 'chat'; workingDir: string; larkAppId: string }>): any {
  return {
    sessionId: overrides.sessionId ?? 's-1',
    rootMessageId: overrides.rootMessageId ?? 'om_root',
    chatId: overrides.chatId ?? 'oc_chat',
    scope: overrides.scope ?? 'thread',
    workingDir: overrides.workingDir,
    larkAppId: overrides.larkAppId ?? 'app-other',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFindByRoot.mockReturnValue([]);
  mockFindByChat.mockReturnValue([]);
});

describe('findInheritablePeer — layer 1 (cross-bot same-anchor)', () => {
  it('returns a thread-scope peer pinned at the same root by another bot', () => {
    mockFindByRoot.mockReturnValue([
      makePeer({ sessionId: 'peer-1', rootMessageId: 'om_root', workingDir: '/repo/a', larkAppId: 'app-other' }),
    ]);
    const result = findInheritablePeer({
      scope: 'thread',
      anchor: 'om_root',
      chatId: 'oc_chat',
      chatType: 'group',
      selfAppId: 'app-self',
    });
    expect(result).toEqual({ sessionId: 'peer-1', larkAppId: 'app-other', workingDir: '/repo/a' });
  });

  it('skips peer that belongs to the same bot (would be self-inherit)', () => {
    mockFindByRoot.mockReturnValue([
      makePeer({ sessionId: 'self-peer', rootMessageId: 'om_root', workingDir: '/repo/a', larkAppId: 'app-self' }),
    ]);
    const result = findInheritablePeer({
      scope: 'thread',
      anchor: 'om_root',
      chatId: 'oc_chat',
      chatType: 'group',
      selfAppId: 'app-self',
    });
    expect(result).toBeNull();
  });

  it('returns chat-scope peer pinned at the same chat by another bot', () => {
    mockFindByChat.mockReturnValue([
      makePeer({ sessionId: 'peer-2', chatId: 'oc_chat', scope: 'chat', workingDir: '/repo/b', larkAppId: 'app-other' }),
    ]);
    const result = findInheritablePeer({
      scope: 'chat',
      anchor: 'oc_chat',
      chatId: 'oc_chat',
      chatType: 'group',
      selfAppId: 'app-self',
    });
    expect(result).toEqual({ sessionId: 'peer-2', larkAppId: 'app-other', workingDir: '/repo/b' });
  });
});

describe('findInheritablePeer — layer 2 removed (普通群 new thread no longer inherits chat-scope)', () => {
  it('returns null when scope=thread + chatType=group + only sibling is a chat-scope session', () => {
    // Layer 1: no same-anchor peer.
    mockFindByRoot.mockReturnValue([]);
    // Layer 2 used to fall through to chat-scope siblings — must NOT anymore.
    mockFindByChat.mockReturnValue([
      makePeer({ sessionId: 'chat-peer', chatId: 'oc_chat', scope: 'chat', workingDir: '/repo/outer', larkAppId: 'app-self' }),
    ]);
    const result = findInheritablePeer({
      scope: 'thread',
      anchor: 'om_new_thread',
      chatId: 'oc_chat',
      chatType: 'group',
      selfAppId: 'app-self',
    });
    expect(result).toBeNull();
  });

  it('still returns null when chat-scope peer belongs to another bot (no same-anchor peer)', () => {
    mockFindByRoot.mockReturnValue([]);
    mockFindByChat.mockReturnValue([
      makePeer({ sessionId: 'chat-peer-other-bot', chatId: 'oc_chat', scope: 'chat', workingDir: '/repo/outer', larkAppId: 'app-other' }),
    ]);
    const result = findInheritablePeer({
      scope: 'thread',
      anchor: 'om_new_thread',
      chatId: 'oc_chat',
      chatType: 'group',
      selfAppId: 'app-self',
    });
    expect(result).toBeNull();
  });
});

describe('findInheritablePeer — guards', () => {
  it('returns null when no peer has a workingDir set', () => {
    mockFindByRoot.mockReturnValue([
      makePeer({ sessionId: 'peer-no-dir', rootMessageId: 'om_root', workingDir: undefined, larkAppId: 'app-other' }),
    ]);
    const result = findInheritablePeer({
      scope: 'thread',
      anchor: 'om_root',
      chatId: 'oc_chat',
      chatType: 'group',
      selfAppId: 'app-self',
    });
    expect(result).toBeNull();
  });

  it('returns null in p2p when no same-anchor peer exists', () => {
    mockFindByRoot.mockReturnValue([]);
    mockFindByChat.mockReturnValue([]);
    const result = findInheritablePeer({
      scope: 'thread',
      anchor: 'om_dm',
      chatId: 'oc_p2p',
      chatType: 'p2p',
      selfAppId: 'app-self',
    });
    expect(result).toBeNull();
  });
});
