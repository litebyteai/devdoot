/**
 * Greets the user or returns a default greeting.
 * @param name The name of the person to greet.
 * @returns The greeting string.
 */
export function greet(name?: string): string {
  return `Hello, ${name || 'World'}!`;
}
