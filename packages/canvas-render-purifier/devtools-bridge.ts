import { SceneNode } from './scene-graph';

// Integrates custom reconciler updates with React DevTools global hook
export function connectReactDevTools(renderer: any): void {
  if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    try {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      hook.onCommitFiberRoot(renderer.currentRendererId, renderer.fiberRoot, undefined, false);
      console.log('Canvas Render Purifier successfully bridged to React DevTools.');
    } catch (e) {
      console.debug('DevTools hook connection bypassed or pending initialization.');
    }
  }
}

export function traceNodeSelection(node: SceneNode): void {
  // Highlights selected canvas elements inside developers inspection panels
  if (typeof window !== 'undefined') {
    (window as any).$nexusSelectedNode = node;
  }
}
