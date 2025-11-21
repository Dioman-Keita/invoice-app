/**
 * Déclarations TypeScript pour le module carbone
 */

declare module 'carbone' {
  interface CarboneOptions {
    convertTo?: string;
    timezone?: string;
    lang?: string;
    translations?: Record<string, Record<string, string>>;
  }

  interface CarboneRenderOptions {
    convertTo?: string;
    timezone?: string;
    lang?: string;
  }

  function set(options: CarboneOptions): void;
  
  function render(
    templatePath: string,
    data: any,
    options: CarboneRenderOptions,
    callback: (err: any, result: Buffer) => void
  ): void;

  function render(
    templatePath: string,
    data: any,
    callback: (err: any, result: Buffer) => void
  ): void;
}