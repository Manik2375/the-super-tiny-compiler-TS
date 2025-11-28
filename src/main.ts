interface Token {
	type: "paren" | "number" | "string" | "name";
	value: string;
}

// Abstract Syntax Tree
interface AST {
	type: "Program";
	body: ASTInnerNodes[];
	_context?: TransformedASTNode[];
}

type ASTNode = ASTNodeLiteral | ASTNodeExpression | AST; // since AST (the top Program) is also a kind of node
type ASTInnerNodes = ASTNodeLiteral | ASTNodeExpression; // not the top AST node for the interface

interface ASTNodeLiteral {
	type: "NumberLiteral" | "StringLiteral";
	value: string;
}

interface ASTNodeExpression {
	type: "CallExpression";
	name: string;
	params: ASTNode[];
	_context?: TransformedASTNode[]; // old ASTNode has link to new Transfomed AST nodes
}

// types used after transforming
interface TransformedAST {
	type: "Program";
	body: TransformedASTInnerNode[];
}

type TransformedASTNode =
	| TransformedAST
	| TransformedCallExpression
	| TransformedExpressionStatement
	| TransformedLiteral;

type TransformedASTInnerNode =
	| TransformedCallExpression
	| TransformedExpressionStatement
	| TransformedLiteral;

type TransfomedExpression = TransformedExpressionStatement | TransformedCallExpression;

interface TransformedExpressionStatement {
	type: "ExpressionStatement";
	expression: TransformedCallExpression;
}

interface TransformedCallExpression {
	type: "CallExpression";
	callee: TransformedIdentifier;
	arguments: TransformedASTNode[];
}

// to seperate AST and TransformedAST for avoiding confusion (You otherwise have to think how they relate)
interface TransformedLiteral {
	type: "NumberLiteral" | "StringLiteral";
	value: string;
}

interface TransformedIdentifier {
	type: "Identifier";
	name: string;
}

// *********************************

interface Visitor {
	NumberLiteral?: VisitorMethod;
	StringLiteral?: VisitorMethod;
	CallExpression?: VisitorMethod;
	Program?: VisitorMethod;
}

interface VisitorMethod {
	enter?: (node: ASTNode, parent: ASTNode | null) => void;
	exit?: (node: ASTNode, parent: ASTNode | null) => void;
}

class Compiler {

	compile(input: string) {
		const tokens = this.tokenizer(input);
		const ast = this.parser(tokens);
		const newAst = this.transformer(ast);
		const output = this.codeGenerator(newAst);

		return output;
	}

	visitorMethods: Visitor = {
		NumberLiteral: {
			enter(node, parent) {
				if (parent && "_context" in parent && "value" in node) {
					parent._context?.push({
						type: "NumberLiteral",
						value: node.value,
					});
				}
			},
		},
		StringLiteral: {
			enter(node, parent) {
				if (parent && "_context" in parent && "value" in node) {
					parent._context?.push({
						type: "StringLiteral",
						value: node.value,
					});
				}
			},
		},
		CallExpression: {
			enter(node, parent) {
				if (parent && "name" in node && "_context" in parent) {
					let expression: TransfomedExpression = {
						type: "CallExpression",
						callee: {
							type: "Identifier",
							name: node.name,
						},
						arguments: [],
					};

					node._context = expression.arguments;

					if (parent.type != "CallExpression") {
						expression = {
							type: "ExpressionStatement",
							expression,
						};
					}

					parent._context?.push(expression);
				}
			},
		},
	};

	tokenizer(input: String): Token[] {
		let current = 0;

		const WHITESPACE = /\s/;
		const NUMBERS = /[0-9]/;
		const LETTERS = /[a-z]/;

		const tokens: Token[] = [];
		while (current < input.length) {
			let char = input[current];

			if (char === "(") {
				tokens.push({
					type: "paren",
					value: "(",
				});
				current++;
				continue;
			}
			if (char === ")") {
				tokens.push({
					type: "paren",
					value: ")",
				});
				current++;
				continue;
			}

			if (WHITESPACE.test(char)) {
				// ignore the whitespace
				current++;
				continue;
			}

			if (NUMBERS.test(char)) {
				let value = "";

				while (NUMBERS.test(char)) {
					value += char;
					char = input[++current];
				}

				tokens.push({
					type: "number",
					value,
				});
				continue;
			}

			if (char === "\"") {
				let value = "";

				char = input[++current];

				while (char !== "\"") {
					value += char;
					char = input[++current];
				}
				char = input[++current];

				tokens.push({
					type: "string",
					value
				})
				continue;
			}

			if (LETTERS.test(char)) {
				let value = "";

				while (LETTERS.test(char)) {
					value += char;
					char = input[++current];
				}

				tokens.push({
					type: "name",
					value,
				});
				continue;
			}
			throw new TypeError("Can't identify the character at position: " + current);
		}

		return tokens;
	}
	parser(tokens: Token[]): AST {
		let current = 0;

		function walk(): ASTInnerNodes {
			let token = tokens[current];

			if (token.type === "number") {
				current++;

				return {
					type: "NumberLiteral",
					value: token.value,
				};
			}

			if (token.type === "string") {
				current++;

				return {
					type: "StringLiteral",
					value: token.value,
				};
			}

			if (token.type === "paren" && token.value === "(") {
				token = tokens[++current]; // contains whole name from tokenizer step

				const node: ASTNodeExpression = {
					type: "CallExpression",
					name: token.value,
					params: [],
				};

				token = tokens[++current];

				while (token.type != "paren" || (token.type === "paren" && token.value !== ")")) {
					node.params.push(walk()); // the inner functions will keep incrementing the current
					token = tokens[current];
				}

				current++;

				return node;
			}

			throw new TypeError("Error parsing on token type: " + token.type);
		}

		const ast: AST = {
			type: "Program",
			body: [],
		};

		// we are using loop for cases like (add 2 3)(subtract 5 4)
		while (current < tokens.length) {
			ast.body.push(walk());
		}

		return ast;
	}

	traverser(ast: AST, visitor: Visitor): void {
		function traverseArray(array: ASTNode[], parent: ASTNode) {
			array.forEach((child) => {
				traverseNode(child, parent);
			});
		}
		function traverseNode(node: ASTNode, parent: ASTNode | null) {
			let methods = visitor[node.type];

			// use the initial enter method
			if (methods && methods.enter) {
				methods.enter(node, parent);
			}

			switch (node.type) {
				case "Program":
					traverseArray(node.body, node);
					break;

				case "CallExpression":
					traverseArray(node.params, node);
					break;

				case "NumberLiteral":
				case "StringLiteral":
					break;

				default:
					throw new TypeError("Error in traversing: " + node);
			}

			if (methods && methods.exit) {
				methods.exit(node, parent);
			}
		}

		traverseNode(ast, null);
	}

	transformer(ast: AST) {
		// remember, the newAST is changed by call by reference
		const newAST: TransformedAST = {
			type: "Program",
			body: [],
		};

		ast._context = newAST.body;

		this.traverser(ast, this.visitorMethods);

		return newAST;
	}

	codeGenerator(node: TransformedASTNode | TransformedIdentifier): string {
		switch (node.type) {
			case "Program":
				return node.body.map((child) => this.codeGenerator(child)).join("\n");

			case "ExpressionStatement":
				return this.codeGenerator(node.expression) + ";";

			case "CallExpression":
				return (

					this.codeGenerator(node.callee) +
					"(" +
					node.arguments.map((child) => this.codeGenerator(child)).join(", ") +
					")"
				);

			case "Identifier":
				return node.name;
			case "NumberLiteral":
				return node.value;
			case "StringLiteral":
				return `"${node.value}"`;
			default:
				throw new TypeError("Error in codeGenerator at node: " + node);
		}
	}
}

export default Compiler;
