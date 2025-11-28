import Compiler from "./main.js";

const compiler = new Compiler();

// Plan to just pass the content either in constructor function or make a compile function, yayy


const input = "(add 2 (subtract 4 2))";

console.log("Result: " + compiler.compile(input));