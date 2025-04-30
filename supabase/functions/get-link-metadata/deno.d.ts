// Type definitions for Deno Edge Function imports
declare module "https://deno.land/std@0.177.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/cheerio@1.0.0-rc.12" {
  export function load(html: string): CheerioAPI;
  
  interface CheerioAPI {
    (selector: string): Cheerio;
  }
  
  interface Cheerio {
    text(): string;
    attr(name: string): string | undefined;
  }
}

declare module "https://esm.sh/linkifyjs@4.1.1" {
  export function find(text: string): Array<{href: string}>;
} 