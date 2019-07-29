declare module 'sigil-js' {
  export interface RendererElement {
    tag: string;
    meta: object;
    attr: object;
    children: RendererData[];
  }

  export interface Renderer<T> {
    svg(p: RendererElement): T;
    circle(p: RendererElement): T;
    rect(p: RendererElement): T;
    path(p: RendererElement): T;
    g(p: RendererElement): T;
    polygon(p: RendererElement): T;
    line(p: RendererElement): T;
    polyline(p: RendererElement): T;
  }

  export const SVGComponents: Renderer<HTMLElement>;
  export const PlainSVGStringRenderer: Renderer<string>;

  export interface PourArguments<T> {
    patp: string | string[];
    size: number;
    renderer?: Renderer<T>;
    margin?: 'auto' | number;
    color?: [string, string];
    sylgraph?: object;
  }

  export interface RawPourArguments<T> extends PourArguments<T> {
    sylgraph: object;
  }

  export function pour<T = HTMLElement>(args: PourArguments<T>): T;
  export function _pour<T = HTMLElement>(args: PourArguments<T>): T;
}
