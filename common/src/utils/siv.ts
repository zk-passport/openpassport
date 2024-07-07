/**
 * Converts a string of maximum 30 characters to a single BigInt.
 * Each byte is represented by three digits in the resulting BigInt.
 * @param str The input string (max 30 characters)
 * @returns A BigInt representing the concatenated byte values
 */
export function stringToNumber(str: string): bigint {
    if (str.length > 30) {
        throw new Error("Input string must not exceed 30 characters");
    }
    return BigInt(Array.from(str)
        .map(char => char.charCodeAt(0).toString().padStart(3, '0'))
        .join(''));
}

/**
 * Converts a BigInt (representing concatenated byte values) back to a string.
 * @param num The input BigInt
 * @returns The reconstructed string
 */
export function numberToString(num: bigint): string {
    const str = num.toString().padStart(90, '0'); // Ensure padding at the start
    if (str.length > 90) { // 30 characters * 3 digits per character
        throw new Error("Input number represents more than 30 characters");
    }
    const bytes = str.match(/.{3}/g) || [];
    return String.fromCharCode(...bytes.map(byte => parseInt(byte)));
}

// Example usage:
const str = "aAHello, World!";
const num = stringToNumber(str);
console.log(num); // 97065072101108108111044032087111114108100033n
const reconstructed = numberToString(num);
console.log("reconstructed: ", reconstructed); // Should log: "aAHello, World!"
