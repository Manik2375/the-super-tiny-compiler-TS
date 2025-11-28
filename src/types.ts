export interface Token {
	type: "paren" | "number" | "string" | "name";
	value: string;
}

// Abstract Syntax Tree
export interface AST {
	type: "Program";
	body: ASTInnerNodes[];
	_context?: TransformedASTNode[];
}

export type ASTNode = ASTNodeLiteral | ASTNodeExpression | AST; // since AST (the top Program) is also a kind of node
export type ASTInnerNodes = ASTNodeLiteral | ASTNodeExpression; // not the top AST node for the interface

export interface ASTNodeLiteral {
	type: "NumberLiteral" | "StringLiteral";
	value: string;
}

export interface ASTNodeExpression {
	type: "CallExpression";
	name: string;
	params: ASTNode[];
	_context?: TransformedASTNode[]; // old ASTNode has link to new Transfomed AST nodes
}

// types used after transforming
export interface TransformedAST {
	type: "Program";
	body: TransformedASTInnerNode[];
}

export type TransformedASTNode =
	| TransformedAST
	| TransformedCallExpression
	| TransformedExpressionStatement
	| TransformedLiteral;

export type TransformedASTInnerNode =
	| TransformedCallExpression
	| TransformedExpressionStatement
	| TransformedLiteral;

export type TransformedExpression = TransformedExpressionStatement | TransformedCallExpression;

export interface TransformedExpressionStatement {
	type: "ExpressionStatement";
	expression: TransformedCallExpression;
}

export interface TransformedCallExpression {
	type: "CallExpression";
	callee: TransformedIdentifier;
	arguments: TransformedASTNode[];
}

// to seperate AST and TransformedAST for avoiding confusion (You otherwise have to think how they relate)
export interface TransformedLiteral {
	type: "NumberLiteral" | "StringLiteral";
	value: string;
}

export interface TransformedIdentifier {
	type: "Identifier";
	name: string;
}

// *********************************

export interface Visitor {
	NumberLiteral?: VisitorMethod;
	StringLiteral?: VisitorMethod;
	CallExpression?: VisitorMethod;
	Program?: VisitorMethod;
}

export interface VisitorMethod {
	enter?: (node: ASTNode, parent: ASTNode | null) => void;
	exit?: (node: ASTNode, parent: ASTNode | null) => void;
}
