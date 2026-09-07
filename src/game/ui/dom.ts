export function el<T extends HTMLElement>(id: string): T {
  const node = document.querySelector(`#${id}`);
  if (!(node instanceof HTMLElement)) {
    throw new Error(`Missing #${id}`);
  }
  return node as T;
}

export function show(id: string, visible: boolean): void {
  el(id).hidden = !visible;
}
