/**
 * Represents a function that takes no arguments and returns a value of type T
 * @template T The return type of the function (defaults to void)
 */
export type Fn<T = void> = () => T;
