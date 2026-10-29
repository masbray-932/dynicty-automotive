import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement, type FormEvent, type ReactElement, type ReactNode } from "react";
const hooks = vi.hoisted(() => ({ values: [] as unknown[], refs: [] as { current: unknown }[], state: 0, ref: 0, effects: [] as (() => void)[] }));
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => { const i = hooks.state++; if (!(i in hooks.values)) hooks.values[i] = initial; return [hooks.values[i], (next: unknown) => { hooks.values[i] = next; }]; },
  useRef: (initial: unknown) => { const i = hooks.ref++; hooks.refs[i] ??= { current: initial }; return hooks.refs[i]; },
  useId: () => "confirmation-test",
  useEffect: (effect: () => void) => { hooks.effects.push(effect); },
  useCallback: (fn: unknown) => fn,
  useSyncExternalStore: () => true,
}));
import { ConfirmationForm } from "@/components/admin/confirmation-form";
import { brandConfirmation } from "@/features/admin/confirmation-policy";
type ElementProps = { children?: ReactNode; ref?: { current: unknown }; onClick?: () => void; onCancel?: (event: { preventDefault: () => void }) => void; onKeyDown?: (event: { key: string; shiftKey: boolean; preventDefault: () => void }) => void; onSubmit?: (event: FormEvent<HTMLFormElement>) => void; action?: unknown; disabled?: boolean; changed?: (pending: boolean) => void };
function nodes(node: ReactNode): ReactElement<ElementProps>[] { return Array.isArray(node) ? node.flatMap(nodes) : isValidElement<ElementProps>(node) ? [node, ...nodes(node.props.children)] : []; }
const NativeFormData = FormData;
beforeEach(() => { hooks.values = []; hooks.refs = []; hooks.state = hooks.ref = 0; hooks.effects = []; vi.unstubAllGlobals(); });

function fixture() {
  const action = vi.fn(); const focus = vi.fn();
  const trigger = { isConnected: true, focus };
  let name = "New brand";
  let tree: ReturnType<typeof ConfirmationForm>;
  const dialog = { open: false, showModal: vi.fn(() => { dialog.open = true; }), close: vi.fn(() => { dialog.open = false; }) };
  const cancel = { focus: vi.fn() };
  const form = { querySelector: () => trigger, requestSubmit: vi.fn(() => submit()) };
  vi.stubGlobal("FormData", class extends NativeFormData { constructor() { super(); this.set("name", name); } });
  function render() {
    hooks.state = hooks.ref = 0; hooks.effects = [];
    tree = ConfirmationForm({ action, confirmation: data => brandConfirmation({ name: "Old brand" }, data), children: <button type="submit">Save</button> });
    nodes(tree).find(x => x.type === "form")!.props.ref!.current = form;
    nodes(tree).find(x => x.type === "dialog")!.props.ref!.current = dialog;
    nodes(tree).filter(x => x.type === "button").find(x => x.props.ref)!.props.ref!.current = cancel;
    for (const effect of hooks.effects) effect();
    return tree;
  }
  function submit() {
    let prevented = false;
    const event = { currentTarget: form, nativeEvent: { submitter: trigger }, get defaultPrevented() { return prevented; }, preventDefault() { prevented = true; } } as unknown as FormEvent<HTMLFormElement>;
    tree.props.onSubmit(event);
    if (!prevented) action();
    return prevented;
  }
  render();
  return { action, focus, dialog, cancel, submit, render, setName: (value: string) => { name = value; } };
}

describe("shared confirmation gate (DOM adapter; not browser certification)", () => {
  it("does not execute mutation before confirmation; cancel restores focus without reset", () => {
    const f = fixture(); expect(f.submit()).toBe(true); expect(f.action).not.toHaveBeenCalled();
    const tree = f.render(); expect(f.dialog.showModal).toHaveBeenCalled(); expect(f.cancel.focus).toHaveBeenCalled();
    nodes(tree).find(x => x.type === "button" && x.props.ref)!.props.onClick!();
    expect(f.action).not.toHaveBeenCalled(); expect(f.dialog.close).toHaveBeenCalled(); expect(f.focus).toHaveBeenCalled();
  });
  it("executes once and blocks immediate duplicate confirmation", () => {
    const f = fixture(); f.submit(); const tree = f.render();
    const confirm = nodes(tree).filter(x => Boolean(x.props.onClick)).at(-1)!;
    confirm.props.onClick!(); confirm.props.onClick!();
    expect(f.action).toHaveBeenCalledTimes(1);
  });
  it("requires a new confirmation if critical data changed while the modal was open", () => {
    const f = fixture(); f.submit(); const tree = f.render(); f.setName("A different brand");
    nodes(tree).filter(x => Boolean(x.props.onClick)).at(-1)!.props.onClick!();
    expect(f.action).not.toHaveBeenCalled();
    expect(JSON.stringify(f.render())).toContain("A different brand");
  });
  it("Escape cancels and pending observer closes/unlocks after completion", () => {
    const f = fixture(); f.submit(); let tree = f.render();
    const preventDefault = vi.fn(); nodes(tree).find(x => x.type === "dialog")!.props.onCancel!({ preventDefault });
    expect(preventDefault).toHaveBeenCalled(); expect(f.action).not.toHaveBeenCalled();
    f.submit(); tree = f.render(); nodes(tree).filter(x => Boolean(x.props.onClick)).at(-1)!.props.onClick!();
    const observer = nodes(tree).find(x => x.props.changed)!;
    observer.props.changed!(true); tree = f.render();
    expect(nodes(tree).find(x => x.type === "fieldset")!.props.disabled).toBe(true);
    observer.props.changed!(false); f.render();
    expect(f.dialog.open).toBe(false); expect(f.focus).toHaveBeenCalled();
    expect(f.submit()).toBe(true); // Next critical attempt must ask again.
  });
  it("cycles Tab and Shift+Tab within the dialog controls", () => {
    const f = fixture(); f.submit(); const tree = f.render();
    const first = { focus: vi.fn() }, last = { focus: vi.fn() }; const preventDefault = vi.fn();
    vi.stubGlobal("document", { activeElement: last });
    const handler = nodes(tree).find(x => x.type === "dialog")!.props.onKeyDown!;
    handler({ key: "Tab", shiftKey: false, preventDefault, currentTarget: { querySelectorAll: () => [first, last] } } as Parameters<typeof handler>[0]);
    expect(first.focus).toHaveBeenCalled();
    vi.stubGlobal("document", { activeElement: first });
    handler({ key: "Tab", shiftKey: true, preventDefault, currentTarget: { querySelectorAll: () => [first, last] } } as Parameters<typeof handler>[0]);
    expect(last.focus).toHaveBeenCalled();
  });
});
