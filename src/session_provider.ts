import internal = require("stream");
import vscode, { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState, } from "vscode";
import { SessionItem } from "./session_item";



export class SessionViewProviderItem extends TreeItem {

    constructor(item: SessionItem) {
        super('', TreeItemCollapsibleState.None);

        this.id = item.device.vmServiceUri;
        this.label = item.device.session._configuration.deviceName;
        this.description = item.device.session._workspaceFolder.name.toUpperCase();
        this.tooltip = 'Select';

        this.command = {
            title: 'Change Device',
            command: 'flutter-network.change-device',
            arguments: [
                item,
            ]
        };
    }
}

export class SessionViewProvider implements TreeDataProvider<SessionViewProviderItem>{
    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

    private sessions: Array<SessionItem> = [];

    constructor() { }

    public refreshData(sessions: Array<SessionItem>) {
        this.sessions = sessions;
        this._onDidChangeTreeData.fire(null);
    }

    getTreeItem(element: SessionViewProviderItem) {
        return element;
    }

    getChildren(element: SessionViewProviderItem) {
        return this.sessions.map(e => {
            return new SessionViewProviderItem(e);
        });
    }

}
