import * as vscode from 'vscode';
import { SessionViewProvider } from './session_provider';
import { RequestProviderProvider } from './request_provider';
import { SessionItem } from './session_item';
import { DeviceModel } from './model/device_model';
import path from 'path';
import fs from 'fs';
import { RequestTaskModel } from './model/request_task_model';

var mainContext: vscode.ExtensionContext;

var sessionsView = new SessionViewProvider();
var requestsView = new RequestProviderProvider();

var requestPanel: vscode.WebviewPanel | null = null;;

var sessions: SessionItem[] = [];
var timer: NodeJS.Timeout | null = null;
var refreshTag = -1;
// var currentDevice: DeviceModel | null = null;
var currentSession: SessionItem | null = null;

export function deactivate() {
	// console.log('deactivate');
	if (timer !== null) {
		clearInterval(timer);
		timer = null;
	}
}

export function activate(context: vscode.ExtensionContext) {

	// console.log('Congratulations, your extension "flutter-network" is now active!');
	mainContext = context;

	/// Command Event
	let refreshDevice = vscode.commands.registerCommand('flutter-network.refresh-device', onRefreshDeviceList);
	let changeDevice = vscode.commands.registerCommand('flutter-network.change-device', onSelectDevice);
	let openWebview = vscode.commands.registerCommand('flutter-network.request-detail', onOpenRequestDetail);

	context.subscriptions.push(refreshDevice);
	context.subscriptions.push(changeDevice);
	context.subscriptions.push(openWebview);
	context.subscriptions.push(vscode.commands.registerCommand('flutter-network.test', (e) => {
		// loadNetworkListData();
	}));


	/// Register View
	vscode.window.registerTreeDataProvider('flutter-network-devices', sessionsView);
	vscode.window.registerTreeDataProvider('flutter-network-requests', requestsView);


	/// Listener
	context.subscriptions.push(vscode.debug.onDidTerminateDebugSession(e => {
		// console.log('onDidTerminateDebugSession');
		setTimeout(() => onRefreshDeviceList(), 255);
	}));
	context.subscriptions.push(vscode.debug.onDidReceiveDebugSessionCustomEvent((e) => {
		if (e.event !== 'dart.log' && e.event !== 'dart.progressStart' && e.event !== 'dart.progressUpdate' && e.event !== 'dart.progressEnd' && e.event !== 'dart.serviceExtensionAdded') {
			// console.log('onDidReceiveDebugSessionCustomEvent', e);
		}

		if (e.event === 'dart.debuggerUris') {
		}
		else if (e.event === 'dart.flutter.serviceExtensionStateChanged' && e.body.extension === 'ext.flutter.activeDevToolsServerAddress') {
			onRefreshDeviceList();
		}
		else if (e.event === 'dart.hotRestartRequest') {
			// sendData('getVM', {});
			// items.clear();
		}
		else if (e.event === 'dart.log') {
		}
		else if (e.event === 'dart.flutter.serviceExtensionStateChanged') {
		}
	}));
}

function onRefreshDeviceList() {
	// vscode.window.showInformationMessage('Hello World from Flutter Network!');
	let list: DeviceModel[] = vscode.extensions.getExtension('Dart-Code.dart-code')?.exports._privateApi.debugSessions;
	list = list.filter(e => e.vmServiceUri !== undefined && e.vmServiceUri !== null && e.vmServiceUri.length > 0);
	// console.log(list);
	let tmpSessions: SessionItem[] = [];
	for (let i = 0; i < list.length; i++) {
		let device = list[i];

		let result = sessions.filter(e => e.device.vmServiceUri === device.vmServiceUri);
		if (result.length === 0) {
			let item = new SessionItem(device);
			tmpSessions.push(item);
		} else {
			let item = result[0];
			item.reloadVMInfo();
			tmpSessions.push(item);
		}
	}

	sessions.forEach(e => {
		let has = tmpSessions.filter(inner => e.device.vmServiceUri === inner.device.vmServiceUri).length > 0;
		if (has === false) {
			e.dispose();
		}
	});

	sessions = tmpSessions;
	sessionsView.refreshData(sessions);

	if (currentSession === null && sessions.length > 0) {
		currentSession = sessions[0];
	}

	if (sessions.length === 0 && timer !== null) {
		clearInterval(timer);
		timer = null;
	} else if (sessions.length > 0 && timer === null) {
		timer = setInterval(() => onRefreshRequestList(), 1000);
	}
}

function onRefreshRequestList() {
	for (let i = 0; i < sessions.length; i++) {
		const e = sessions[i];
		if (e !== currentSession) {
			continue;
		};

		e.reloadRequestList();
		if (refreshTag !== e.refreshTag) {
			// console.log(e.refreshTag);
			refreshTag = e.refreshTag;
			requestsView.refreshData(Array.from(e.items.values()));
		}
	}
}

function onSelectDevice(e: SessionItem) {
	currentSession = e;
	refreshTag = -1;
}

function onOpenRequestDetail(requestTask: RequestTaskModel) {
	if (requestPanel === null) {
		requestPanel = vscode.window.createWebviewPanel(
			'FlutterNetworkWebview', // viewType
			"Request Detail",
			vscode.ViewColumn.One,
			{ enableScripts: true, retainContextWhenHidden: true },
		);
		requestPanel.webview.html = getWebViewContent(mainContext, 'request-template.html');
		requestPanel.onDidDispose(() => {
			// console.log('Request detail Webview onDidDispose');
			requestPanel = null;
		});
	} else {
		requestPanel.reveal();
	}

	requestPanel.webview.postMessage({ request: requestTask });

	currentSession?.getRequestDetail(requestTask).then(res => {
		// console.log('getHttpProfileRequest Result', res);
		requestPanel?.webview?.postMessage({ request: res });
	}).catch(err => {
		// console.log('getHttpProfileRequest Error', err);
	});
}

function getWebViewContent(context: vscode.ExtensionContext, templatePath: string) {
	const resourcePath = path.join(context.extensionPath, 'assets', 'template', templatePath);
	const dirPath = path.dirname(resourcePath);
	let html = fs.readFileSync(resourcePath, 'utf-8');
	html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
		return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
	});
	return html;
}
