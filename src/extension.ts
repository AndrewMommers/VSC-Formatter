import * as vscode from 'vscode';

const SUPPORTED_LANGUAGES = [
    'javascript',
    'typescript',
    'json',
    'python',
    'sqf',
    'cfg',
    'cpp',
    'go',
];

function formatDocument(document: vscode.TextDocument): vscode.TextEdit[] {
    const edits: vscode.TextEdit[] = [];
    const lines = document.getText().split(/\r?\n/);

    const formattedLines: string[] = [];
    let indentLevel = 0;
    let lastWasEmpty = false;

    const INDENT = '    '; // 4 spaces
    const COMMENT_ALIGN_COLUMN = 60;

    for (let rawLine of lines) {
        let line = rawLine.trim();

        if (line === '') {
            if (!lastWasEmpty) {
                formattedLines.push('');
                lastWasEmpty = true;
            }
            continue;
        }

        lastWasEmpty = false;

        // Decrease indent BEFORE writing line if starts with '}'
        if (line.startsWith('}')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }

        // Normalize `=` spacing
        line = line.replace(/\s*=\s*/g, ' = ');

        // Move `{` inline with class/function if needed
        line = line.replace(/\s*\{\s*$/, ' {');

        let indent = INDENT.repeat(indentLevel);

        // Align comments (//)
        if (line.includes('//')) {
            const [codePart, commentPart] = line.split('//');
            const trimmedCode = codePart.trimEnd();
            const targetPadding = Math.max(1, COMMENT_ALIGN_COLUMN - indent.length - trimmedCode.length);
            const padding = ' '.repeat(targetPadding);
            line = `${trimmedCode}${padding}// ${commentPart.trim()}`;
        }

        formattedLines.push(indent + line);

        // Increase indent AFTER writing line if ends with '{'
        if (line.endsWith('{')) {
            indentLevel++;
        }
    }

    for (let i = 0; i < document.lineCount; i++) {
        const currentLine = document.lineAt(i);
        const newText = formattedLines[i] || '';
        if (currentLine.text !== newText) {
            edits.push(vscode.TextEdit.replace(currentLine.range, newText));
        }
    }

    return edits;
}

function registerFormatter(languageId: string, context: vscode.ExtensionContext) {
    const provider = vscode.languages.registerDocumentFormattingEditProvider(languageId, {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            console.log(`📝 Formatting: ${document.fileName} [${document.languageId}]`);
            return formatDocument(document);
        }
    });

    context.subscriptions.push(provider);
}

export function activate(context: vscode.ExtensionContext) {
    console.log('✅ MCO-CodeFormatter is now active!');
    for (const language of SUPPORTED_LANGUAGES) {
        registerFormatter(language, context);
    }
}

export function deactivate() { }
