export interface RequestTaskModel {
    type: string;
    id: number;
    isolateId: string;
    method: string;
    uri: string;
    startTime: number;
    endTime: number;
    request: Request;
    response: Response;
}

export interface Response {
    startTime: number;
    headers: any;
    compressionState: string;
    connectionInfo: ConnectionInfo;
    contentLength: number;
    cookies: any[];
    isRedirect: boolean;
    persistentConnection: boolean;
    reasonPhrase: string;
    redirects: any[];
    statusCode: number;
    endTime: number;
}

export interface Request {
    events: RequestEvents[];
    headers: any;
    connectionInfo: ConnectionInfo;
    contentLength: number;
    cookies: any[];
    followRedirects: boolean;
    maxRedirects: number;
    method: string;
    persistentConnection: boolean;
    uri: string;
    filterKey: string;
}
export interface RequestEvents {
    timestamp: number;
    event: string;
}

export interface ConnectionInfo {
    localPort: number;
    remoteAddress: string;
    remotePort: number;
}
