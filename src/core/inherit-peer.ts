/**
 * Decide whether a newly created session can reuse a sibling's `workingDir`
 * and skip the repo-selection card.
 *
 * Layer 1 — same-anchor cross-bot peer
 *   Another bot already pinned a workingDir at exactly this anchor (thread →
 *   root, chat → chatId). Covers 同根 thread reply / 同群 chat-scope reply
 *   collaboration: A bot is already running, B bot gets pulled in via
 *   @mention, B inherits A's workingDir without bouncing the user through
 *   another card. Same-bot is excluded — that path is handled elsewhere
 *   (sessions resume from their own state).
 *
 * Note on what's intentionally NOT covered:
 *   普通群 + scope=thread + same-chat chat-scope sibling. Used to fall through
 *   here so a user manually creating a 话题 in 普通群 reused the outer
 *   chat-scope's workingDir. We removed that — the user's intent on a manual
 *   topic is "isolate the context", and silently inheriting overrides it.
 *   See docs/superpowers/specs/2026-05-10-force-topic-mode-design.md.
 */
import * as sessionStore from '../services/session-store.js';

export interface InheritOptions {
  scope: 'thread' | 'chat';
  anchor: string;
  chatId: string;
  chatType: 'group' | 'p2p';
  selfAppId: string;
}

export interface InheritedPeer {
  sessionId: string;
  larkAppId?: string;
  workingDir: string;
}

export function findInheritablePeer(opts: InheritOptions): InheritedPeer | null {
  const { scope, anchor, chatId, selfAppId } = opts;
  const sameAnchorPeers = scope === 'thread'
    ? sessionStore.findActiveSessionsByRoot(anchor)
    : sessionStore.findActiveChatScopeSessionsByChat(chatId);
  const peer = sameAnchorPeers.find(p => p.larkAppId !== selfAppId && !!p.workingDir);
  if (peer && peer.workingDir) {
    return { sessionId: peer.sessionId, larkAppId: peer.larkAppId, workingDir: peer.workingDir };
  }
  return null;
}
