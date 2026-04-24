/**
 * Plankalkül VS Code Extension
 *
 * Provides language support for Konrad Zuse's Plankalkül (1945),
 * the world's first high-level programming language.
 *
 * Features:
 * - Syntax highlighting for linear (.pk) and 2D (.pk2d) notation
 * - Language Server Protocol support for completions, diagnostics, etc.
 * - Custom 2D editor for the original two-dimensional notation
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';
import { PlankalkulEditor2DProvider } from './editor2d/editorProvider';

let client: LanguageClient | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Plankalkül extension activating...');

    // Register the 2D custom editor
    context.subscriptions.push(
        PlankalkulEditor2DProvider.register(context)
    );

    // Start the LSP client
    startLanguageClient(context);

    // Register commands
    registerCommands(context);

    console.log('Plankalkül extension activated');
}


function resolveLanguageServerPath(context: vscode.ExtensionContext): string | undefined {
    const config = vscode.workspace.getConfiguration('plankalkul');
    const configuredPath = config.get<string>('lsp.path');
    if (configuredPath) {
        return configuredPath;
    }

    const bundledServer = getBundledServerPath(context);
    const possiblePaths = [
        bundledServer,
        path.join(context.extensionPath, '..', 'lsp', '_build', 'default', 'src', 'server.exe'),
        path.join(context.extensionPath, '..', 'lsp', 'plankalkul-lsp.exe'),
    ].filter((p): p is string => Boolean(p));

    return possiblePaths.find(p => fs.existsSync(p));
}

function getBundledServerPath(context: vscode.ExtensionContext): string | undefined {
    const binaries: Record<string, string> = {
        'linux-x64': 'plankalkul-lsp-linux-x64',
        'darwin-x64': 'plankalkul-lsp-darwin-x64',
        'darwin-arm64': 'plankalkul-lsp-darwin-arm64',
        'win32-x64': 'plankalkul-lsp-windows-x64.exe',
    };
    const binaryName = binaries[`${process.platform}-${process.arch}`];
    return binaryName ? path.join(context.extensionPath, 'bin', binaryName) : undefined;
}

function startLanguageClient(context: vscode.ExtensionContext) {
    const serverPath = resolveLanguageServerPath(context);

    if (!serverPath) {
        vscode.window.showWarningMessage(
            'Plankalkül LSP server not found. Some features will be unavailable. ' +
            'Set plankalkul.lsp.path in settings.'
        );
        return;
    }

    const serverOptions: ServerOptions = {
        command: serverPath,
        args: [],
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'plankalkul' },
            { scheme: 'file', language: 'plankalkul2d' },
        ],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.{pk,pk2d}')
        }
    };

    client = new LanguageClient(
        'plankalkul',
        'Plankalkül Language Server',
        serverOptions,
        clientOptions
    );

    // Start the client (this also starts the server)
    client.start().catch(err => {
        console.error('Failed to start Plankalkül LSP:', err);
        vscode.window.showWarningMessage(
            'Failed to start Plankalkül language server. ' +
            'Check that the server is installed correctly.'
        );
    });

    context.subscriptions.push({
        dispose: () => {
            if (client) {
                client.stop();
            }
        }
    });
}

function registerCommands(context: vscode.ExtensionContext) {
    // Compile to C
    context.subscriptions.push(
        vscode.commands.registerCommand('plankalkul.compileToC', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }

            const config = vscode.workspace.getConfiguration('plankalkul');
            const compilerPath = config.get<string>('compiler.path') || 'plankalkul';

            const terminal = vscode.window.createTerminal('Plankalkül Compiler');
            terminal.sendText(`"${compilerPath}" --emit-c "${editor.document.fileName}"`);
            terminal.show();
        })
    );

    // Show 2D preview (for linear files)
    context.subscriptions.push(
        vscode.commands.registerCommand('plankalkul.showPreview2D', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }

            // Create a preview panel
            const panel = vscode.window.createWebviewPanel(
                'plankalkul2dPreview',
                'Plankalkül 2D Preview',
                vscode.ViewColumn.Beside,
                { enableScripts: true }
            );

            // TODO: Generate 2D HTML from the linear source
            panel.webview.html = getPreview2DContent(editor.document.getText());
        })
    );

    // Convert linear to 2D
    context.subscriptions.push(
        vscode.commands.registerCommand('plankalkul.convertTo2D', async () => {
            vscode.window.showInformationMessage('Convert to 2D: Coming soon');
        })
    );

    // Convert 2D to linear
    context.subscriptions.push(
        vscode.commands.registerCommand('plankalkul.convertToLinear', async () => {
            vscode.window.showInformationMessage('Convert to Linear: Coming soon');
        })
    );
}

function getPreview2DContent(source: string): string {
    // Basic preview - will be enhanced
    return `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: 'Consolas', 'Courier New', monospace;
                padding: 20px;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .block {
                margin-bottom: 20px;
                border: 1px solid var(--vscode-panel-border);
                padding: 10px;
            }
            .row {
                display: flex;
                font-family: monospace;
            }
            .row-marker {
                width: 30px;
                color: var(--vscode-symbolIcon-keywordForeground);
                font-weight: bold;
            }
            .row-content {
                flex: 1;
                white-space: pre;
            }
            .expr-row { color: var(--vscode-editor-foreground); }
            .v-row { color: var(--vscode-symbolIcon-variableForeground); }
            .k-row { color: var(--vscode-symbolIcon-fieldForeground); }
            .s-row { color: var(--vscode-symbolIcon-typeParameterForeground); }
        </style>
    </head>
    <body>
        <h2>2D Notation Preview</h2>
        <p><em>This is a preview of how the code would look in Zuse's original 2D notation.</em></p>
        <div class="block">
            <div class="row expr-row">
                <span class="row-marker"> |</span>
                <span class="row-content">${escapeHtml(source.split('\n')[0] || '')}</span>
            </div>
            <div class="row v-row">
                <span class="row-marker">V|</span>
                <span class="row-content">(indices)</span>
            </div>
            <div class="row k-row">
                <span class="row-marker">K|</span>
                <span class="row-content">(components)</span>
            </div>
            <div class="row s-row">
                <span class="row-marker">S|</span>
                <span class="row-content">(types)</span>
            </div>
        </div>
        <p><small>Full 2D conversion coming soon...</small></p>
    </body>
    </html>`;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function deactivate(): Thenable<void> | undefined {
    if (client) {
        return client.stop();
    }
    return undefined;
}
