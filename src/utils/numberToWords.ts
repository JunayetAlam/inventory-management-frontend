/**
 * Converts a numerical currency amount to English words formatted for Taka invoices.
 * e.g. 2450.50 -> "Two Thousand Four Hundred Fifty Taka and Fifty Paisa Only"
 */
export function numberToWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return "Zero Taka Only";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertNumber(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    }
    if (n < 1000) {
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " " + convertNumber(n % 100) : "")
      );
    }
    if (n < 100000) {
      return (
        convertNumber(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + convertNumber(n % 1000) : "")
      );
    }
    if (n < 10000000) {
      return (
        convertNumber(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + convertNumber(n % 100000) : "")
      );
    }
    return (
      convertNumber(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + convertNumber(n % 10000000) : "")
    );
  }

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  let result = convertNumber(integerPart) + " Taka";

  if (decimalPart > 0) {
    result += " and " + convertNumber(decimalPart) + " Paisa";
  }

  return result + " Only";
}
