/* --------------------------------------------------------------
    MCO-CodeFormatter Extension
    Supports formatting for: JavaScript, TypeScript, JSON, Python, SQF, CFG, CPP
   -------------------------------------------------------------- */

import * as vscode from 'vscode';

/* ---------------------------
    Supported Language Identifiers
   --------------------------- */
const SUPPORTED_LANGUAGES = [
    'javascript',
    'typescript',
    'json',
    'python',
    'sqf',
    'cfg',
    'cpp',
];

/* -------------------
    Format a single line
   ------------------- */
function formatLine(lineText: string): string {
    return lineText.replace(/^(\s*)(.*)$/, (_, indent, code) =>
        indent +
        code
            // Normalize spaces around assignment operator
            .replace(/\s*=\s*/g, ' = ')
            // Remove spaces before semicolons, keep one after if needed
            .replace(/\s*;\s*/g, ';')
            // Ensure space before opening curly brace
            .replace(/\s*{\s*/g, ' {')
            // Remove spaces before closing curly brace
            .replace(/\s*}\s*/g, '}')
            // Replace multiple spaces with one
            .replace(/ {2,}/g, ' ')
            // Trim trailing whitespace
            .replace(/[ \t]+$/, '')
    );
}

/* -------------------
    Register formatter
   ------------------- */
function registerFormatter(languageId: string, context: vscode.ExtensionContext) {
    const provider = vscode.languages.registerDocumentFormattingEditProvider(languageId, {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            console.log(`📝 Formatting: ${document.fileName} [${document.languageId}]`);

            const edits: vscode.TextEdit[] = [];

            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const formatted = formatLine(line.text);

                if (line.text !== formatted) {
                    edits.push(vscode.TextEdit.replace(line.range, formatted));
                }
            }

            return edits;
        }
    });

    context.subscriptions.push(provider);
}

/* ----------------
    Extension Activation
   ---------------- */
export function activate(context: vscode.ExtensionContext) {
    console.log('✅ MCO-CodeFormatter is now active!');

    for (const language of SUPPORTED_LANGUAGES) {
        registerFormatter(language, context);
    }
}

/* -------------------
    Extension Deactivation
   ------------------- */
export function deactivate() { }
