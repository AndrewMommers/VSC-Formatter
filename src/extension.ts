import * as vscode from 'vscode';

const SUPPORTED_LANGUAGES = ['cpp', 'hpp', 'sqf', 'cfg'];

function formatDocument(document: vscode.TextDocument): vscode.TextEdit[] {
    const edits: vscode.TextEdit[] = [];
    const lines = document.getText().split(/\r?\n/);
    const formattedLines: string[] = [];

    const INDENT = '    '; // 4 spaces
    let indentLevel = 0;
    let insideArray = false;
    let arrayBuffer: string[] = [];

    const assignRegex = /^\s*(\w+)\s*=\s*(.+?);?$/;
    const arrayElementRegex = /^\s*"([^"]+)"\s*,\s*"([^"]*)"\s*(\/\/.*)?$/;

    const flushArrayBuffer = () => {
        if (arrayBuffer.length === 0) return;

        const parsed = arrayBuffer.map(line => {
            const match = line.match(arrayElementRegex);
            if (!match) return { k: '', v: '', comment: '', raw: line };

            const [, k, v, comment] = match;
            return { k, v, comment: comment?.trim() ?? '', raw: line };
        });

        const maxKey = Math.max(...parsed.map(e => e.k.length));
        const maxVal = Math.max(...parsed.map(e => e.v.length));

        parsed.forEach(({ k, v, comment, raw }) => {
            if (!k) {
                formattedLines.push(INDENT.repeat(indentLevel) + raw.trim());
                return;
            }
            const padKey = ' '.repeat(maxKey - k.length + 2);
            const padVal = ' '.repeat(maxVal - v.length + 2);
            const line = `${INDENT.repeat(indentLevel)}"${k}",${padKey}"${v}"${padVal}${comment}`;
            formattedLines.push(line.trimEnd());
        });

        arrayBuffer.length = 0;
    };

    for (let raw of lines) {
        let line = raw.trim();

        // Handle scope end first
        if (/^};?$/.test(line)) {
            flushArrayBuffer();
            indentLevel = Math.max(indentLevel - 1, 0);
            formattedLines.push(INDENT.repeat(indentLevel) + line);
            continue;
        }

        // Opening brace
        if (/^{\s*$/.test(line)) {
            formattedLines.push(INDENT.repeat(indentLevel) + '{');
            indentLevel++;
            continue;
        }

        // Assignment (outside arrays)
        const assignMatch = line.match(assignRegex);
        if (assignMatch && !insideArray) {
            const [_, key, value] = assignMatch;
            const pad = ' '.repeat(20 - key.length);
            formattedLines.push(`${INDENT.repeat(indentLevel)}${key}${pad}= ${value.replace(/;$/, '')};`);
            continue;
        }

        // Array start
        if (/.*\[\]\s*=\s*{/.test(line)) {
            insideArray = true;
            formattedLines.push(INDENT.repeat(indentLevel) + line.replace(/\s+/g, ' '));
            continue;
        }

        // Array end
        if (insideArray && /^};$/.test(line)) {
            flushArrayBuffer();
            formattedLines.push(INDENT.repeat(indentLevel) + '};');
            insideArray = false;
            continue;
        }

        if (insideArray) {
            arrayBuffer.push(line);
            continue;
        }

        // Class opening
        if (/^class\s+\w+.*\{\s*$/.test(line)) {
            formattedLines.push(INDENT.repeat(indentLevel) + line);
            indentLevel++;
            continue;
        }

        // Class closing with semicolon
        if (/^\};$/.test(line)) {
            indentLevel = Math.max(indentLevel - 1, 0);
            formattedLines.push(INDENT.repeat(indentLevel) + line);
            continue;
        }

        // Pass-through fallback
        formattedLines.push(INDENT.repeat(indentLevel) + line);
    }

    for (let i = 0; i < document.lineCount; i++) {
        const originalLine = document.lineAt(i).text;
        const newLine = formattedLines[i] || '';
        if (originalLine !== newLine) {
            edits.push(vscode.TextEdit.replace(document.lineAt(i).range, newLine));
        }
    }

    return edits;
}

function registerFormatter(languageId: string, context: vscode.ExtensionContext) {
    const provider = vscode.languages.registerDocumentFormattingEditProvider(languageId, {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            console.log(`🧹 Formatting: ${document.fileName}`);
            return formatDocument(document);
        }
    });
    context.subscriptions.push(provider);
}

export function activate(context: vscode.ExtensionContext) {
    console.log('🟢 MCO Code Formatter Active');
    for (const lang of SUPPORTED_LANGUAGES) {
        registerFormatter(lang, context);
    }
}

export function deactivate() {}
