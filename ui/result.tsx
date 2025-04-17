"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
interface ResultProps {
  result: {
    inputBinary: string;
    outputBinary: string;
    outputHex: string;
    status: string;
    message: string;
    replacedPage?: string | null;
    newPage?: string;
    physicalFrame?: number;
    inputHex?: string;
  };
  conversionMode: string;
  indexBits: number;
}

const Result = ({ result, conversionMode, indexBits }: ResultProps) => {
  const colorizeIndexBits = (binary: string, isVirtual: boolean) => {
    const binaries = binary.split(" ");
    const colorClass = isVirtual ? "text-red-800" : "text-blue-600";

    const bitsToColorize = isVirtual ? indexBits : indexBits - 1;

    let processedBits = 0;
    const colorizedTags = [];

    for (let i = 0; i < binaries.length; i++) {
      const part = binaries[i];

      if (processedBits + part.length <= bitsToColorize) {
        colorizedTags.push(`<span class="${colorClass}">${part}</span>`);
        processedBits += part.length;
      } else if (processedBits < bitsToColorize) {
        const colorizedBits = bitsToColorize - processedBits;
        const normal = part.substring(colorizedBits);
        const colorized = part.substring(0, colorizedBits);

        colorizedTags.push(
          `<span class="${colorClass}">${colorized}</span>${normal}`
        );
        processedBits = bitsToColorize;
      } else {
        colorizedTags.push(part);
      }
    }

    return (
      <span dangerouslySetInnerHTML={{ __html: colorizedTags.join(" ") }} />
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Input address in hexadecimal</TableCell>
          <TableCell className="text-right">&#x23;{result?.inputHex}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Address To Be Mapped in Binary</TableCell>
          <TableCell className="text-right">
            {conversionMode === "v2p"
              ? colorizeIndexBits(result.inputBinary, true)
              : colorizeIndexBits(result.inputBinary, false)}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Mapped Address in Binary</TableCell>
          <TableCell className="text-right">
            {result.status === "error" || result.status === "unmapped" ? (
              <span
                className={
                  result.status === "error" ? "text-red-500" : "text-amber-500"
                }
              >
                {result.message}
              </span>
            ) : conversionMode === "v2p" ? (
              colorizeIndexBits(result.outputBinary, false)
            ) : (
              colorizeIndexBits(result.outputBinary, true)
            )}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Converted Address in HEX</TableCell>
          <TableCell className="text-right">
            {result.status === "error" || result.status === "unmapped" ? (
              <span
                className={
                  result.status === "error" ? "text-red-500" : "text-amber-500"
                }
              >
                {result.message}
              </span>
            ) : (
              <>&#x23;{result.outputHex}</>
            )}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Status</TableCell>
          <TableCell
            className={`text-right ${
              result.status === "page_fault"
                ? "text-red-500 font-bold"
                : result.status === "unmapped"
                ? "text-amber-500"
                : result.status === "success"
                ? "text-green-600 "
                : ""
            }`}
          >
            {result.message}
          </TableCell>
        </TableRow>
        {result.status === "page_fault" && result.replacedPage && (
          <TableRow>
            <TableCell>Page Replacement Information</TableCell>
            <TableCell className="text-right">
              <div className="bg-amber-50 p-2 rounded text-sm inline-block">
                <p>
                  Replaced page{" "}
                  <span className="font-mono">{result.replacedPage}</span> with
                  page <span className="font-mono">{result.newPage}</span> in
                  frame {result.physicalFrame}
                </p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default Result;
