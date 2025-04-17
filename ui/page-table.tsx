"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { decToBits, PageMap } from "@/lib/utils";

interface PageTableProps {
  pageMappingEntries: PageMap[];
  conversionMode: string;
  indexBits: number;
  step: string;
  presentBits: number[];
  updatePresentBits: (index: number, value: number) => void;
  updatePhysicalIndexes: (index: number, value: number) => void;
  highlightedPage: number | null;
}

const PageTable = ({
  pageMappingEntries,
  conversionMode,
  indexBits,
  step,
  presentBits,
  updatePresentBits,
  updatePhysicalIndexes,
  highlightedPage,
}: PageTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Virtual Page Index</TableHead>
            <TableHead>Physical Page Index</TableHead>
            <TableHead>Present Bit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageMappingEntries.map((entry, index) => (
            <TableRow
              key={index}
              className={
                highlightedPage === entry.virtualIndex ? "bg-blue-50" : ""
              }
            >
              <TableCell>
                <span
                  className={
                    conversionMode === "v2p" ? "text-red-800" : "text-blue-600"
                  }
                >
                  {decToBits(entry.virtualIndex, indexBits)}
                </span>
              </TableCell>
              <TableCell>
                {step === "physical_bits" && entry.present ? (
                  <Input
                    type="number"
                    min={0}
                    max={Math.pow(2, indexBits - 1) - 1}
                    defaultValue={0}
                    onChange={(e) =>
                      updatePhysicalIndexes(
                        index,
                        Number.parseInt(e.target.value)
                      )
                    }
                  />
                ) : (
                  entry.present && (
                    <span
                      className={
                        conversionMode === "v2p"
                          ? "text-blue-600"
                          : "text-red-800"
                      }
                    >
                      {decToBits(entry.physicalIndex, indexBits - 1)}
                    </span>
                  )
                )}
              </TableCell>
              <TableCell className="text-center">
                {step === "present_bits" ? (
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    value={presentBits[index]}
                    onChange={(e) =>
                      updatePresentBits(index, Number.parseInt(e.target.value))
                    }
                    className="w-16 mx-auto"
                  />
                ) : entry.present ? (
                  "1"
                ) : (
                  "0"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PageTable;
