import WebSocket, { CONNECTING, OPEN } from "ws";
import { DeviceModel } from "./model/device_model";
import { RequestTaskModel } from "./model/request_task_model";

export class SessionItem {
    public device: DeviceModel;
    public items: Map<number, RequestTaskModel> = new Map();
    public refreshTag = 0;
    private timer: NodeJS.Timeout | null = null;

    private wsInstance: WebSocket | null;
    private messageID = 1;
    private vmInfo: any;
    private timestamp: number = 0;
    private updatedSince: number = 0;

    private callback = new Map();

    constructor(device: DeviceModel) {
        this.device = device;

        this.wsInstance = new WebSocket(device.vmServiceUri.replace('http', 'ws'));
        this.wsInstance.on('open', () => this.onOpen());
        this.wsInstance.on('message', (e: Buffer) => this.onReceivedData(e));
        this.wsInstance.on('close', () => this.onClose());

        // this.timer = setInterval(e => this.reloadRequestList(), 500);
    }

    public dispose() {
        this.wsInstance?.close();
    }

    public reloadVMInfo() {
        this.items.clear();
        this.updatedSince = 0;

        this.sendData('getVM', {});
    }

    public reloadRequestList() {
        if (this.vmInfo === undefined || this.vmInfo === null || this.wsInstance?.readyState !== OPEN) {
            return;
        }

        this.sendData('ext.dart.io.getHttpProfile', {
            isolateId: this.vmInfo.isolates[0].id,
            updatedSince: this.updatedSince,
        });
    }

    private onOpen() {
        // console.log('onOpen');

        this.reloadVMInfo();
    }

    private onReceivedData(data: Buffer) {
        const json = JSON.parse(data.toString());
        // console.log(json);

        const { id, jsonrpc, result } = json;
        switch (result.type) {
            case 'VM':
                // console.log(result);
                this.vmInfo = result;
                this.sendData('ext.dart.io.httpEnableTimelineLogging', {
                    isolateId: this.vmInfo.isolates[0].id,
                    enabled: true,
                });
                break;
            case 'HttpTimelineLoggingState':
                // console.log(result);
                break;
            case 'Timestamp':
                this.timestamp = result.timestamp;
                // console.log(Date.now(), this.timestamp);
                break;
            case 'HttpProfile':
                this.updatedSince = result.timestamp;
                if (result.requests.length > 0) {
                    result.requests.forEach((item: RequestTaskModel) => {
                        if (item.uri.endsWith('png') || item.uri.endsWith('jpg')) {
                        } else {
                            this.items.set(item.id, item);
                        }
                    });

                    this.refreshTag++;
                }
                break;
            case 'Sentinel':
                // console.error(result);
                this.sendData('getVM', {});
                break;

        }

        if (!!this.callback.get(id)) {
            this.callback.get(id)(result);
            this.callback.delete(id);
        }
    }

    private onClose() {
        // console.log('disconnected');
        if (this.timer !== null) {
            clearInterval(this.timer);
        }

        this.wsInstance?.removeAllListeners();
        this.wsInstance?.close();
        this.wsInstance = null;
    }

    public getRequestDetail(request: RequestTaskModel) {
        return this.getDataAsync('ext.dart.io.getHttpProfileRequest', { "id": request.id });
    }

    private getDataAsync(method: string, params: any) {
        return new Promise((resolve, reject) => {
            const id = `${this.messageID}`;
            this.callback.set(id, resolve);
            this.sendData(method, { isolateId: this.vmInfo.isolates[0].id, ...params });
            setTimeout(() => {
                if (!!this.callback.get(id)) {
                    this.callback.delete(id);
                    reject('Timeout');
                }
            }, 1000);
        });
    }

    private sendData(method: string, params: any) {
        if (this.wsInstance === undefined || this.wsInstance === null) {
            return;
        }
        let data = { "jsonrpc": "2.0", "id": `${this.messageID++}`, "method": method, "params": params };
        this.wsInstance?.send(JSON.stringify(data));
        // console.log(data);
    }
}