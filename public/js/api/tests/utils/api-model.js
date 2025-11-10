import { AssertableResponse } from './assertable-response';
const getMatchingPathParams = (path) => {
    const pathParamRegex = /:([a-zA-Z0-9_-]+)(?=\/|$)/g;
    const matches = [];
    let match;
    while ((match = pathParamRegex.exec(path)) !== null) {
        if (match[1])
            matches.push(match[1]);
    }
    return matches;
};
export class APIModel {
    constructor(url) {
        this.url = url;
        this.request = (path, method) => async (options) => {
            const url = new URL(`${this.url}${path}`);
            const searchParams = new URLSearchParams(options.queryParams);
            for (const [key, value] of searchParams) {
                url.searchParams.append(key, value);
            }
            if (options.pathParams) {
                const requiredParams = getMatchingPathParams(path);
                const providedParams = Object.keys(options.pathParams);
                const missingParams = requiredParams.filter((param) => !providedParams.includes(param));
                if (missingParams.length > 0) {
                    throw new Error(`The path parameters do not include all of the keys that are defined in "${path}": ${JSON.stringify(options.pathParams)}`);
                }
                const extraParams = providedParams.filter((param) => !requiredParams.includes(param));
                if (extraParams.length > 0) {
                    throw new Error(`The path parameters contain keys that are not defined in "${path}": ${JSON.stringify(options.pathParams)}`);
                }
                url.pathname = url.pathname.replace(/:([a-zA-Z0-9_-]+)(?=\/|$)/g, (match, key) => {
                    return encodeURIComponent(options.pathParams[key] || '');
                });
            }
            const headers = options.headers || {};
            let body;
            if (options.body) {
                if (options.body instanceof FormData) {
                    body = options.body;
                }
                else {
                    headers['Content-Type'] = 'application/json';
                    body = JSON.stringify(options.body);
                }
            }
            const init = {
                method,
                headers,
                body,
            };
            LOGGER.log(`Making a ${method} request to "${url.toString()}"`);
            const response = await fetch(url, init);
            return AssertableResponse.fromResponse(response);
        };
    }
}
