declare module 'urbit-ob' {
  export function patp(point: string | number): string;
  export function patp2dec(patp: string | number): string;
  export function patp2hex(patp: string | number): string;
  export function hex2patp(hex: string): string;
  export function isValidPatp(patp: string): boolean;

  export function patq(patp: string): string;
  export function patq2dec(patq: string): string;
  export function patq2hex(patq: string): string;
  export function hex2patq(hex: string): string;
  export function isValidPatq(patq: string): boolean;

  export function eqPatq(patq1: string, patq2: string): boolean;
}
