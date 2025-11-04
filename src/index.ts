import { Code, Root } from "mdast";
import { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { PluginOptions } from "./types.ts";

const COMPONENT_NAME = "Mermaid";

const MERMAID_IMPORT_AST = {
  type: "mdxjsEsm",
  data: {
    estree: {
      body: [
        {
          type: "ImportDeclaration",
          specifiers: [
            {
              type: "ImportSpecifier",
              imported: { type: "Identifier", name: COMPONENT_NAME },
              local: { type: "Identifier", name: COMPONENT_NAME },
            },
          ],
          source: {
            type: "Literal",
            value: "@omurilo/remark-mermaid/Mermaid",
          },
        },
      ],
    },
  },
} as any;

function stringifyObject(object: string | Object): string {
  if (typeof object === "string") return `'${object}'`;
  if (Array.isArray(object))
    return `[${object.map(stringifyObject).join(", ")}]`;
  return Object.entries(object)
    .map(([k, v]) => ` { ${k}: ${stringifyObject(v)} }`)
    .join()
    .trim();
}

function parseObjectToJsxAttribute(
  object: any,
): Record<string, unknown> | Array<Record<string, unknown>> {
  return Object.entries(object).map(([key, value]) => {
    return {
      type: "Property",
      shorthand: false,
      computed: false,
      method: false,
      kind: "init",
      key: {
        type: "Identifier",
        name: key,
      },
      value:
        typeof value === "string"
          ? {
              type: "Literal",
              value,
              raw: `'${value}'`,
            }
          : {
              type: "ObjectExpression",
              properties: parseObjectToJsxAttribute(value),
            },
    };
  });
}

function generateJsxAttribute(key: string, value: any) {
  if (!value) return null;

  const rootObj = {
    type: "mdxJsxAttribute",
    name: key,
  };

  if (typeof value === "string") {
    return Object.assign(rootObj, {
      value: value,
    });
  }

  return Object.assign(rootObj, {
    value: {
      type: "mdxJsxAttributeValueExpression",
      value: stringifyObject(value),
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          comments: [],
          body: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "ObjectExpression",
                properties: parseObjectToJsxAttribute(value),
              },
            },
          ],
        },
      },
    },
  });
}

export const remarkMermaid: Plugin<[PluginOptions], Root> =
  (options: PluginOptions) => (ast, _file, done) => {
    const codeblocks: any[][] = [];
    visit(
      ast,
      { type: "code", lang: "mermaid" },
      (node: Code, index, parent) => {
        codeblocks.push([node, index, parent]);
      },
    );

    if (codeblocks.length !== 0) {
      const themeOption = generateJsxAttribute("theme", options.theme);
      const classNameOption = generateJsxAttribute(
        "className",
        options.className,
      );

      for (const [node, index, parent] of codeblocks) {
        parent.children.splice(index, 1, {
          type: "mdxJsxFlowElement",
          name: COMPONENT_NAME,
          attributes: [
            {
              type: "mdxJsxAttribute",
              name: "chart",
              value: node.value.replaceAll("\n", "\\n"),
            },
            themeOption,
            classNameOption,
          ].filter(Boolean),
        });
      }
      ast.children.unshift(MERMAID_IMPORT_AST);
    }

    done();
  };
