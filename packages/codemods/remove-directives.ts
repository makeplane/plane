import { API, FileInfo, Options } from "jscodeshift";
import type { CommentKind, DirectiveKind } from "ast-types/gen/kinds";

export default function transform(file: FileInfo, api: API, options: Options) {
    const j = api.jscodeshift;
    const root = j(file.source);

    const directivesToRemove = new Set(["use client", "use server", "use-client", "use-server"]);

    root.find(j.Program).forEach((path) => {
        // Handle ASTs where directives are stored in 'directives' property (Babel/TS)
        if (path.node.directives) {
            const newDirectives: DirectiveKind[] = [];
            let capturedComments: CommentKind[] = [];

            path.node.directives.forEach((directive) => {
                if (directive.type === 'Directive' && directive.value.type === 'DirectiveLiteral' && typeof directive.value.value === 'string' && directivesToRemove.has(directive.value.value)) {
                    // Directive is being removed. Capture its comments.
                    if (directive.comments) {
                        capturedComments.push(...directive.comments);
                    }
                } else {
                    // Keep this directive
                    // If we have captured comments from previous removed directives, attach them here?
                    // Usually comments belong to the next node.
                    if (capturedComments.length > 0) {
                        directive.comments = directive.comments || [];
                        directive.comments.unshift(...capturedComments);
                        capturedComments = [];
                    }
                    newDirectives.push(directive);
                }
            });

            path.node.directives = newDirectives;

            // If we still have captured comments (e.g. all directives removed, or last one removed),
            // attach them to the first body node.
            if (capturedComments.length > 0) {
                if (path.node.body.length > 0) {
                    const firstBodyNode = path.node.body[0];
                    if (firstBodyNode) {
                        firstBodyNode.comments = firstBodyNode.comments || [];
                        firstBodyNode.comments.unshift(...capturedComments);
                    }
                } else {
                    // If empty body, attach to Program?
                    // jscodeshift might not print Program comments easily if they are not attached to children.
                    // But let's try attaching to the Program node itself if possible, or leave them (they might be lost).
                    path.node.comments = path.node.comments || [];
                    path.node.comments.push(...capturedComments);
                }
            }
        }

        // Also handle the case where they might be in body as ExpressionStatements
        if (path.node.body) {
            const newBody: any[] = [];
            let capturedComments: any[] = [];

            path.node.body.forEach((node) => {
                let shouldRemove = false;
                if (j.ExpressionStatement.check(node)) {
                    const expression = node.expression;
                    if (j.StringLiteral.check(expression) && directivesToRemove.has(expression.value)) {
                        shouldRemove = true;
                    } else if (j.Literal.check(expression) && typeof expression.value === 'string' && directivesToRemove.has(expression.value)) {
                        shouldRemove = true;
                    }
                }

                if (shouldRemove) {
                    if (node.comments) {
                        capturedComments.push(...node.comments);
                    }
                } else {
                    if (capturedComments.length > 0) {
                        node.comments = node.comments || [];
                        node.comments.unshift(...capturedComments);
                        capturedComments = [];
                    }
                    newBody.push(node);
                }
            });

            // If comments left at the end (e.g. removed last statement), usually they are trailing comments of the file.
            // But if we removed the ONLY statement, they become dangling.
            // We attached to next node, so if we are at the end, there is no next node.
            // If we removed a directive at the top, and there are more statements, they got attached.

            path.node.body = newBody;
        }
    });

    return root.toSource(options);
}

