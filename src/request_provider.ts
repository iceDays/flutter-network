import internal = require("stream");
import { URL } from "url";
import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState, } from "vscode";
import { RequestTaskModel } from "./model/request_task_model";

export class RequestProviderItem extends TreeItem {

    constructor(item: RequestTaskModel) {
        super('', TreeItemCollapsibleState.None);

        let url = new URL(item.uri);

        this.id = item.id.toString();
        this.label = item.method;
        this.description = url.pathname + url.search;
        this.tooltip = item.uri;
        // this.iconPath = "";

        this.command = {
            title: item.uri,
            command: 'flutter-network.request-detail',
            arguments: [
                item,
            ]
        };
    }
}

export class RequestProviderProvider implements TreeDataProvider<RequestProviderItem>{
    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

    private tasks: Array<RequestTaskModel> = [];

    constructor() {}

    public refreshData(tasks: Array<RequestTaskModel>){
        this.tasks = tasks;
        this._onDidChangeTreeData.fire(null);
    }

    getTreeItem(element: RequestProviderItem) {
        return element;
    }

    getChildren(element: RequestProviderItem) {
        return this.tasks.map(e => {
            return new RequestProviderItem(e);
        });
    }

}
