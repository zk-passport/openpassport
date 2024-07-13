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
    return BigInt('1' + Array.from(str)
        .map(char => char.charCodeAt(0).toString().padStart(3, '0'))
        .join(''));
}

/**
 * Converts a BigInt (representing concatenated byte values) back to a string.
 * @param num The input BigInt
 * @returns The reconstructed string
 */
export function numberToString(num: bigint): string {
    const str = num.toString().slice(1); // Remove leading '1'
    const charCodes = str.match(/.{1,3}/g) || [];
    return String.fromCharCode(...charCodes.map(code => parseInt(code, 10)));
}

// // Example usage:
const str = "1H12H3J§éè§2H3";
const num = stringToNumber(str);
console.log(num); // 97065072101108108111044032087111114108100033n
const reconstructed = numberToString(num);
console.log(reconstructed === str);
console.log("reconstructed:", reconstructed); // Should log: "aAHello, World!"