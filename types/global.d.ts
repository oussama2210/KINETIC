// Global Type Declarations for External Pipeline SDKs

declare module "inngest" {
  export class Inngest {
    constructor(options?: any);
    createFunction(config: any, trigger: any, handler: any): any;
    send(event: any): Promise<any>;
  }
}

declare module "inngest/next" {
  export function serve(options: {
    client: any;
    functions: any[];
  }): {
    GET: (req: any) => Promise<any>;
    POST: (req: any) => Promise<any>;
    PUT: (req: any) => Promise<any>;
  };
}

declare module "@aws-sdk/client-s3" {
  export class S3Client {
    constructor(config?: any);
    send(command: any): Promise<any>;
  }
  export class PutObjectCommand {
    constructor(input: any);
  }
  export class GetObjectCommand {
    constructor(input: any);
  }
}

declare module "@aws-sdk/s3-request-presigner" {
  export function getSignedUrl(client: any, command: any, options?: any): Promise<string>;
}
