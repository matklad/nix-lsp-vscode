'use strict';
import * as vscode from 'vscode';

import * as lc from 'vscode-languageclient';

let client: lc.LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('nix-lsp.extendSelection', handleExtendSelection);
    context.subscriptions.push(disposable);
    const run: lc.Executable = {
        command: 'nix-lsp',
        options: { cwd: '.' }
    };
    const serverOptions: lc.ServerOptions = {
        run,
        debug: run
    };
    const clientOptions: lc.LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'nix' }]
    };

    client = new lc.LanguageClient(
        'nix-lsp',
        'nix language server',
        serverOptions,
        clientOptions
    );
    client.start();
}

export function deactivate() {
}


interface ExtendSelectionParams {
    textDocument: lc.TextDocumentIdentifier;
    selections: lc.Range[];
}

export async function handleExtendSelection() {
    const editor = vscode.window.activeTextEditor;
    if (editor == null || editor.document.languageId !== 'nix') {
        return;
    }
    const request: ExtendSelectionParams = {
        selections: editor.selections.map(s => {
            return client.code2ProtocolConverter.asRange(s);
        }),
        textDocument: { uri: editor.document.uri.toString() }
    };
    const response = await client.sendRequest<lc.Range[]>(
        'nix-lsp/extendSelection',
        request
    );
    if (response.length > 0) {
        editor.selections = response.map((range: lc.Range) => {
            const r = client.protocol2CodeConverter.asRange(range);
            return new vscode.Selection(r.start, r.end);
        });
    }
}
