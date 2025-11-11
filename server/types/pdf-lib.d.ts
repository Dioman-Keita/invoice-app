declare module 'pdf-lib' {
  export const StandardFonts: {
    Courier: string;
    CourierBold: string;
    CourierOblique: string;
    CourierBoldOblique: string;
    Helvetica: string;
    HelveticaBold: string;
    HelveticaOblique: string;
    HelveticaBoldOblique: string;
    TimesRoman: string;
    TimesRomanBold: string;
    TimesRomanItalic: string;
    TimesRomanBoldItalic: string;
    Symbol: string;
    ZapfDingbats: string;
  };
  export function rgb(r: number, g: number, b: number): any;
  export class PDFDocument {
    static load(data: Uint8Array | ArrayBuffer | Buffer): Promise<PDFDocument>;
    static create(): Promise<PDFDocument>;
    copyPages(src: PDFDocument, indices: number[]): Promise<any[]>;
    addPage(page?: any | [number, number]): any;
    embedFont(name: string): Promise<any>;
    save(): Promise<Uint8Array>;
  }
}


