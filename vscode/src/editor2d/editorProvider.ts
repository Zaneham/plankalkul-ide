/**
 * Custom Editor Provider for Plankalkül 2D Notation
 *
 * Renders .pk2d files as an interactive grid editor that mirrors
 * Zuse's original two-dimensional notation from the 1940s.
 *
 * The 2D notation looks like:
 *    | V + V => R
 *   V|  0   1      0
 *   K|
 *   S|  i   i      i
 *
 * Each column represents a variable reference, with:
 * - Expression row: the operation/expression
 * - V row: variable index
 * - K row: component index (for structured types)
 * - S row: type annotation
 */

import * as vscode from 'vscode';

export class PlankalkulEditor2DProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'plankalkul.editor2d';

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new PlankalkulEditor2DProvider(context);
        return vscode.window.registerCustomEditorProvider(
            PlankalkulEditor2DProvider.viewType,
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true,
                },
                supportsMultipleEditorsPerDocument: false,
            }
        );
    }

    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        // Set initial content
        webviewPanel.webview.html = this.getHtmlForWebview(
            webviewPanel.webview,
            document.getText()
        );

        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(
            (message) => this.handleMessage(message, document),
            undefined,
            this.context.subscriptions
        );

        // Update webview when document changes
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
            (e) => {
                if (e.document.uri.toString() === document.uri.toString()) {
                    webviewPanel.webview.postMessage({
                        type: 'update',
                        content: document.getText(),
                    });
                }
            }
        );

        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }

    private handleMessage(message: any, document: vscode.TextDocument) {
        switch (message.type) {
            case 'edit':
                // Apply edit from the webview
                this.applyEdit(document, message.content);
                break;
            case 'ready':
                // Webview is ready
                break;
        }
    }

    private applyEdit(document: vscode.TextDocument, newContent: string) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            newContent
        );
        vscode.workspace.applyEdit(edit);
    }

    private getHtmlForWebview(webview: vscode.Webview, content: string): string {
        const blocks = this.parse2DContent(content);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plankalkül 2D Editor</title>
    <style>
        :root {
            --grid-border: var(--vscode-panel-border, #444);
            --cell-bg: var(--vscode-editor-background, #1e1e1e);
            --cell-hover: var(--vscode-list-hoverBackground, #2a2a2a);
            --row-marker-bg: var(--vscode-sideBar-background, #252526);
            --expr-color: var(--vscode-editor-foreground, #d4d4d4);
            --v-color: #4ec9b0;
            --k-color: #9cdcfe;
            --s-color: #c586c0;
            --operator-color: #d19a66;
            --variable-color: #61afef;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-editor-font-family, 'Consolas', monospace);
            font-size: var(--vscode-editor-font-size, 14px);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 20px;
        }

        .header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--grid-border);
        }

        .header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: normal;
        }

        .toolbar {
            display: flex;
            gap: 10px;
            margin-left: auto;
        }

        .toolbar button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            font-size: 12px;
        }

        .toolbar button:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .block {
            margin-bottom: 30px;
            border: 1px solid var(--grid-border);
            border-radius: 4px;
            overflow: hidden;
        }

        .block-header {
            background: var(--row-marker-bg);
            padding: 8px 12px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            border-bottom: 1px solid var(--grid-border);
        }

        .grid-container {
            overflow-x: auto;
        }

        .grid {
            display: table;
            width: 100%;
            border-collapse: collapse;
        }

        .row {
            display: table-row;
        }

        .row-marker {
            display: table-cell;
            width: 40px;
            min-width: 40px;
            background: var(--row-marker-bg);
            text-align: center;
            font-weight: bold;
            padding: 8px;
            border-right: 2px solid var(--grid-border);
            user-select: none;
        }

        .row-marker.expr { color: var(--expr-color); }
        .row-marker.v { color: var(--v-color); }
        .row-marker.k { color: var(--k-color); }
        .row-marker.s { color: var(--s-color); }

        .cell {
            display: table-cell;
            min-width: 60px;
            padding: 8px 12px;
            border-right: 1px solid var(--grid-border);
            border-bottom: 1px solid var(--grid-border);
            vertical-align: middle;
            text-align: center;
        }

        .cell:last-child {
            border-right: none;
        }

        .row:last-child .cell {
            border-bottom: none;
        }

        .cell.editable {
            cursor: text;
        }

        .cell.editable:hover {
            background: var(--cell-hover);
        }

        .cell.editable:focus {
            outline: 2px solid var(--vscode-focusBorder);
            outline-offset: -2px;
        }

        .cell.expr {
            color: var(--expr-color);
            font-size: 16px;
        }

        .cell.v { color: var(--v-color); }
        .cell.k { color: var(--k-color); }
        .cell.s { color: var(--s-color); font-style: italic; }

        .cell .operator {
            color: var(--operator-color);
            padding: 0 4px;
        }

        .cell .variable {
            color: var(--variable-color);
        }

        .add-column {
            display: table-cell;
            width: 40px;
            text-align: center;
            vertical-align: middle;
            color: var(--vscode-descriptionForeground);
            cursor: pointer;
            opacity: 0.5;
        }

        .add-column:hover {
            opacity: 1;
            background: var(--cell-hover);
        }

        .empty-state {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }

        .help-text {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 20px;
            padding: 15px;
            background: var(--row-marker-bg);
            border-radius: 4px;
        }

        .help-text h3 {
            margin: 0 0 10px 0;
            font-size: 13px;
        }

        .help-text ul {
            margin: 0;
            padding-left: 20px;
        }

        .help-text li {
            margin: 4px 0;
        }

        .help-text code {
            background: var(--vscode-textCodeBlock-background);
            padding: 1px 4px;
            border-radius: 2px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Plankalkül 2D Editor</h1>
        <div class="toolbar">
            <button onclick="addBlock()">+ Add Block</button>
            <button onclick="viewSource()">View Source</button>
        </div>
    </div>

    <div id="editor">
        ${blocks.length > 0 ? blocks.map((block, i) => this.renderBlock(block, i)).join('') : `
            <div class="empty-state">
                <p>No blocks found. Click "Add Block" to create one.</p>
            </div>
        `}
    </div>

    <div class="help-text">
        <h3>Zuse's 2D Notation</h3>
        <ul>
            <li><strong>Expression Row</strong> ( | ): The actual computation</li>
            <li><strong>V Row</strong>: Variable indices (V0, V1, Z0, R0...)</li>
            <li><strong>K Row</strong>: Component indices for structured types</li>
            <li><strong>S Row</strong>: Type annotations (i=integer, m×n=array)</li>
        </ul>
        <p>Each column aligns vertically to show the full description of each variable.</p>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentContent = ${JSON.stringify(content)};

        // Notify VS Code that we're ready
        vscode.postMessage({ type: 'ready' });

        // Handle updates from VS Code
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'update') {
                currentContent = message.content;
                // Re-render would go here
            }
        });

        function handleCellEdit(blockIndex, rowType, colIndex, newValue) {
            // Update the content and send to VS Code
            vscode.postMessage({
                type: 'edit',
                content: rebuildContent(blockIndex, rowType, colIndex, newValue)
            });
        }

        function addBlock() {
            const newBlock = ' | \\nV| \\nK| \\nS| \\n\\n';
            const newContent = currentContent + newBlock;
            vscode.postMessage({
                type: 'edit',
                content: newContent
            });
        }

        function viewSource() {
            vscode.postMessage({ type: 'viewSource' });
        }

        function rebuildContent(blockIndex, rowType, colIndex, newValue) {
            // Simple rebuild - would need proper parsing in production
            return currentContent;
        }

        // Make cells editable
        document.querySelectorAll('.cell.editable').forEach(cell => {
            cell.contentEditable = true;
            cell.addEventListener('blur', (e) => {
                const blockIndex = parseInt(e.target.dataset.block);
                const rowType = e.target.dataset.row;
                const colIndex = parseInt(e.target.dataset.col);
                handleCellEdit(blockIndex, rowType, colIndex, e.target.textContent);
            });
            cell.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.target.blur();
                }
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const cells = [...document.querySelectorAll('.cell.editable')];
                    const currentIndex = cells.indexOf(e.target);
                    const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
                    if (nextIndex >= 0 && nextIndex < cells.length) {
                        cells[nextIndex].focus();
                    }
                }
            });
        });
    </script>
</body>
</html>`;
    }

    private parse2DContent(content: string): Block[] {
        const blocks: Block[] = [];
        const lines = content.split('\n');
        let currentBlock: Block | null = null;

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip comments
            if (trimmed.startsWith(';') || trimmed.startsWith('#')) {
                continue;
            }

            if (trimmed === '' || trimmed === 'END') {
                if (currentBlock && (currentBlock.expr || currentBlock.v)) {
                    blocks.push(currentBlock);
                }
                currentBlock = null;
                continue;
            }

            if (!currentBlock) {
                currentBlock = { expr: '', v: '', k: '', s: '', columns: [] };
            }

            // Check for row markers (V|, K|, S|, or expression row " |" or "|")
            if (trimmed.startsWith('V|') || trimmed.startsWith('v|')) {
                currentBlock.v = trimmed.substring(2).trim();
            } else if (trimmed.startsWith('K|') || trimmed.startsWith('k|')) {
                currentBlock.k = trimmed.substring(2).trim();
            } else if (trimmed.startsWith('S|') || trimmed.startsWith('s|')) {
                currentBlock.s = trimmed.substring(2).trim();
            } else if (trimmed.startsWith(' |')) {
                currentBlock.expr = trimmed.substring(2).trim();
            } else if (trimmed.startsWith('|')) {
                currentBlock.expr = trimmed.substring(1).trim();
            } else if (!currentBlock.expr && !trimmed.startsWith('V') && !trimmed.startsWith('K') && !trimmed.startsWith('S')) {
                // Assume it's an expression row without prefix
                currentBlock.expr = trimmed;
            }
        }

        // Don't forget the last block
        if (currentBlock && (currentBlock.expr || currentBlock.v)) {
            blocks.push(currentBlock);
        }

        // Parse columns from each block
        for (const block of blocks) {
            block.columns = this.parseColumns(block);
        }

        return blocks;
    }

    private parseColumns(block: Block): Column[] {
        const columns: Column[] = [];

        // Simple tokenization of expression row
        const tokens = block.expr.split(/(\s+|=>|->|[+\-*/=<>]|\(|\))/g)
            .filter(t => t.trim());

        const vTokens = block.v.split(/\s+/).filter(t => t);
        const kTokens = block.k.split(/\s+/).filter(t => t);
        const sTokens = block.s.split(/\s+/).filter(t => t);

        let varIndex = 0;
        for (const token of tokens) {
            if (token.match(/^[VZR]$/i)) {
                columns.push({
                    expr: token,
                    v: vTokens[varIndex] || '',
                    k: kTokens[varIndex] || '',
                    s: sTokens[varIndex] || '',
                    isOperator: false,
                });
                varIndex++;
            } else if (token.match(/^(=>|->|[+\-*/=<>&|])$/)) {
                columns.push({
                    expr: token,
                    v: '',
                    k: '',
                    s: '',
                    isOperator: true,
                });
            } else if (token.trim()) {
                columns.push({
                    expr: token,
                    v: '',
                    k: '',
                    s: '',
                    isOperator: false,
                });
            }
        }

        return columns;
    }

    private renderBlock(block: Block, index: number): string {
        if (block.columns.length === 0) {
            return `
                <div class="block">
                    <div class="block-header">Block ${index + 1}</div>
                    <div class="grid-container">
                        <div class="grid">
                            <div class="row">
                                <div class="row-marker expr"> |</div>
                                <div class="cell expr editable" data-block="${index}" data-row="expr" data-col="0">${this.escapeHtml(block.expr)}</div>
                            </div>
                            <div class="row">
                                <div class="row-marker v">V|</div>
                                <div class="cell v editable" data-block="${index}" data-row="v" data-col="0">${this.escapeHtml(block.v)}</div>
                            </div>
                            <div class="row">
                                <div class="row-marker k">K|</div>
                                <div class="cell k editable" data-block="${index}" data-row="k" data-col="0">${this.escapeHtml(block.k)}</div>
                            </div>
                            <div class="row">
                                <div class="row-marker s">S|</div>
                                <div class="cell s editable" data-block="${index}" data-row="s" data-col="0">${this.escapeHtml(block.s)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        const colHtml = block.columns.map((col, colIndex) => {
            if (col.isOperator) {
                return `
                    <div class="cell expr"><span class="operator">${this.escapeHtml(col.expr)}</span></div>
                `;
            }
            return `
                <div class="cell expr editable" data-block="${index}" data-row="expr" data-col="${colIndex}">
                    <span class="variable">${this.escapeHtml(col.expr)}</span>
                </div>
            `;
        }).join('');

        const vHtml = block.columns.map((col, colIndex) => {
            if (col.isOperator) return '<div class="cell v"></div>';
            return `<div class="cell v editable" data-block="${index}" data-row="v" data-col="${colIndex}">${this.escapeHtml(col.v)}</div>`;
        }).join('');

        const kHtml = block.columns.map((col, colIndex) => {
            if (col.isOperator) return '<div class="cell k"></div>';
            return `<div class="cell k editable" data-block="${index}" data-row="k" data-col="${colIndex}">${this.escapeHtml(col.k)}</div>`;
        }).join('');

        const sHtml = block.columns.map((col, colIndex) => {
            if (col.isOperator) return '<div class="cell s"></div>';
            return `<div class="cell s editable" data-block="${index}" data-row="s" data-col="${colIndex}">${this.escapeHtml(col.s)}</div>`;
        }).join('');

        return `
            <div class="block">
                <div class="block-header">Block ${index + 1}</div>
                <div class="grid-container">
                    <div class="grid">
                        <div class="row">
                            <div class="row-marker expr"> |</div>
                            ${colHtml}
                            <div class="add-column" onclick="addColumn(${index})">+</div>
                        </div>
                        <div class="row">
                            <div class="row-marker v">V|</div>
                            ${vHtml}
                            <div class="add-column"></div>
                        </div>
                        <div class="row">
                            <div class="row-marker k">K|</div>
                            ${kHtml}
                            <div class="add-column"></div>
                        </div>
                        <div class="row">
                            <div class="row-marker s">S|</div>
                            ${sHtml}
                            <div class="add-column"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

interface Block {
    expr: string;
    v: string;
    k: string;
    s: string;
    columns: Column[];
}

interface Column {
    expr: string;
    v: string;
    k: string;
    s: string;
    isOperator: boolean;
}
