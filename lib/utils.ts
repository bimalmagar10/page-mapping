import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class PageMap {
  virtualIndex: number;
  physicalIndex: number;
  present: boolean;

  constructor(virtualIndex = 0, physicalIndex = 0, present = false) {
    this.virtualIndex = virtualIndex;
    this.physicalIndex = physicalIndex;
    this.present = present;
  }
}

const decToBits = (num: number, bits: number): string => {
  return num.toString(2).padStart(bits, "0");
};

const hexToBits = (hex: string): string => {
  const hexToBinaryObj: { [key: string]: string } = {
    "0": "0000",
    "1": "0001",
    "2": "0010",
    "3": "0011",
    "4": "0100",
    "5": "0101",
    "6": "0110",
    "7": "0111",
    "8": "1000",
    "9": "1001",
    a: "1010",
    b: "1011",
    c: "1100",
    d: "1101",
    e: "1110",
    f: "1111",
    A: "1010",
    B: "1011",
    C: "1100",
    D: "1101",
    E: "1110",
    F: "1111",
  };
  return hexToBinaryObj[hex] || "nan";
};

const formatBinary = (binary: string): string => {
  const originalLength = binary.length;
  const paddingNeeded = (4 - (originalLength % 4)) % 4;
  const paddedBinary = binary.padStart(originalLength + paddingNeeded, "0");

  let result = "";
  for (let i = 0; i < paddedBinary.length; i++) {
    result += paddedBinary[i];
    if ((i + 1) % 4 === 0 && i !== paddedBinary.length - 1) {
      result += " ";
    }
  }

  return result.slice(paddingNeeded);
};

export { decToBits, hexToBits, formatBinary };
