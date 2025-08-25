import { AssertableResponse } from './assertable-response';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type RequestOptions<RequestBody> = {
  headers?: Record<string, string>;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: RequestBody;
};

const getMatchingPathParams = (path: string): string[] => {
  const pathParamRegex = /:([a-zA-Z0-9_-]+)(?=\/|$)/g;
  const matches: string[] = [];
  let match;
  while ((match = pathParamRegex.exec(path)) !== null) {
    matches.push(match[1]);
  }
  return matches;
};

export class APIModel {
  constructor(private url: string) {}

  protected request =
    <RequestBody, ResponseBody>(path: string, method: Method) =>
    async (options: RequestOptions<RequestBody>): Promise<AssertableResponse<ResponseBody>> => {
      const url = new URL(`${this.url}${path}`);

      const searchParams = new URLSearchParams(options.queryParams);

      for (const [key, value] of searchParams) {
        url.searchParams.append(key, value);
      }

      if (options.pathParams) {
        const requiredParams = getMatchingPathParams(path);
        const providedParams = Object.keys(options.pathParams);

        // Check for missing parameters
        const missingParams = requiredParams.filter((param) => !providedParams.includes(param));
        if (missingParams.length > 0) {
          throw new Error(
            `The path parameters do not include all of the keys that are defined in "${path}": ${JSON.stringify(options.pathParams)}`,
          );
        }

        // Check for extra parameters
        const extraParams = providedParams.filter((param) => !requiredParams.includes(param));
        if (extraParams.length > 0) {
          throw new Error(
            `The path parameters contain keys that are not defined in "${path}": ${JSON.stringify(options.pathParams)}`,
          );
        }

        // Replace each parameter, we know the keys are valid as we checked above
        // match represents the thing we are replacing, key is the name of the parameter, eg match is "/:x" and key is "x"
        url.pathname = url.pathname.replace(/:([a-zA-Z0-9_-]+)(?=\/|$)/g, (match, key) => {
          return encodeURIComponent(options.pathParams![key]);
        });
      }

      const headers = options.headers || {};
      
      // Add Content-Type header for requests with body
      if (options.body) {
        headers['Content-Type'] = 'application/json';
      }
      
      const init: RequestInit = {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      };

      // For Node.js environments with self-signed certificates, bypass certificate validation
      if (typeof process !== 'undefined' && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }

      console.log(`Making a ${method} request to "${url.toString()}"`);

      const response = await fetch(url, init);

      return AssertableResponse.fromResponse<ResponseBody>(response);
    };
}
