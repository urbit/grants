import moment from 'moment';

export function stripHexPrefix(value: string) {
  return value.replace('0x', '');
}

const toFixed = (num: string, digits: number = 3) => {
  const [integerPart, fractionPart = ''] = num.split('.');
  if (fractionPart.length === digits) {
    return num;
  }
  if (fractionPart.length < digits) {
    return `${integerPart}.${fractionPart.padEnd(digits, '0')}`;
  }

  let decimalPoint = integerPart.length;

  const formattedFraction = fractionPart.slice(0, digits);

  const integerArr = `${integerPart}${formattedFraction}`.split('').map(str => +str);

  let carryOver = Math.floor((+fractionPart[digits] + 5) / 10);

  // grade school addition / rounding
  for (let i = integerArr.length - 1; i >= 0; i--) {
    const currVal = integerArr[i] + carryOver;
    const newVal = currVal % 10;
    carryOver = Math.floor(currVal / 10);
    integerArr[i] = newVal;
    if (i === 0 && carryOver > 0) {
      integerArr.unshift(0);
      decimalPoint++;
      i++;
    }
  }

  const strArr = integerArr.map(n => n.toString());

  strArr.splice(decimalPoint, 0, '.');

  if (strArr[strArr.length - 1] === '.') {
    strArr.pop();
  }

  return strArr.join('');
};

export function formatNumber(num: string, digits?: number): string {
  const parts = toFixed(num, digits).split('.');

  // Remove trailing zeroes on decimal (If there is a decimal)
  if (parts[1]) {
    parts[1] = parts[1].replace(/0+$/, '');

    // If there's nothing left, remove decimal altogether
    if (!parts[1]) {
      parts.pop();
    }
  }

  // Commafy the whole numbers
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return parts.join('.');
}

export const formatDate = (n: undefined | number) =>
  (n && moment(n * 1000).format('MMM Do, YYYY, h:mm a')) || undefined;

export const formatDateFromNow = (n: undefined | number) =>
  (n && moment(n * 1000).fromNow()) || '';
