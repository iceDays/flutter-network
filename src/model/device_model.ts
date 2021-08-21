export interface DeviceModel {
    session: {
        // 54b461da-c124-4cc8-8932-a5072fb2725e
        _id: string;
        // dart
        _type: string;
        // Flutter (iceDays' iPhone)
        _name: string;
        _workspaceFolder: {
            uri: any,
            // health_flutter
            name: string,
            // 0
            index: number,
        };
        _configuration: {
            name: string,
            deviceId: string,
            deviceName: string,
        }

    };
    // "2021-08-09T09:11:52.782Z"
    sessionStart: String;

    vmServiceUri: string;
    observatoryUri: string;
}