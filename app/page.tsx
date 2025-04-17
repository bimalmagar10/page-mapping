"use client";
import { useState, useEffect } from "react";
import { AlertCircle, Microchip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { InfoIcon as InfoCircle, RefreshCw, ArrowRight } from "lucide-react";
import ControlPanel from "@/ui/control-panel";
import PageTable from "@/ui/page-table";
import QueueManager from "@/ui/queue-manager";
import Result from "@/ui/result";
import { decToBits, formatBinary, hexToBits, PageMap } from "@/lib/utils";
import { toast } from "sonner";

export default function Home() {
  // Memory configuration states
  const [virtualMemSize, setVirtualMemSize] = useState<number>(64);
  const [pageSize, setPageSize] = useState<number>(8);
  const [physicalMemSize, setPhysicalMemSize] = useState<number>(32768);
  const [conversionMode, setConversionMode] = useState<string>("v2p");

  //Page Entry Mapping States
  const [totalBits, setTotalBits] = useState<number>(16);
  const [indexBits, setIndexBits] = useState<number>(3);
  const [offsetBits, setOffsetBits] = useState<number>(13);
  const [pageEntries, setPageEntries] = useState<PageMap[]>([]);
  const [presentBits, setPresentBits] = useState<number[]>([]);
  const [arrivalOrders, setArrivalOrders] = useState<number[]>([]);

  //UI states
  const [step, setStep] = useState<string>("config");
  const [noOfPageFaults, setNoOfPageFaults] = useState<number>(0);
  const [alert, setAlert] = useState<string>("");
  const [inputHexAddress, setInputHexAddress] = useState<string>("");
  const [outputResultAddress, setOutputResultAddress] = useState<any>(null);
  const [highlightedPage, setHighlightedPage] = useState<number | null>(null);

  //Create initial configuration
  const createInitialConfiguration = () => {
    //Check if the inputs are valid
    if (virtualMemSize < pageSize) {
      let errTxt = "Virtual memory size must be larger than the page size!";
      setAlert(errTxt);
      toast.error(errTxt);
      return;
    }

    if (virtualMemSize % 2 !== 0) {
      let errTxt = "Virtual memory size must be multiple of 2!";
      setAlert(errTxt);
      toast.error(errTxt);
      return;
    }

    if (virtualMemSize % pageSize !== 0) {
      let errTxt = "Page size must be multiple of the virtual size!";
      setAlert(errTxt);
      toast.error(errTxt);
      return;
    }

    setAlert("");

    //Converting the KB to Bytes
    const virtualSizeInBytes = virtualMemSize * 1024;
    const pageSizeInBytes = pageSize * 1024;
    const physicalSizeInBytes = virtualSizeInBytes / 2; // Assuming that the physical memory is half of the virtual memory

    //Calculate Bits
    const totalBits = Math.ceil(Math.log2(virtualSizeInBytes));
    const offsetBits = Math.ceil(Math.log2(pageSizeInBytes));
    const indexBits = totalBits - offsetBits;
    setPhysicalMemSize(physicalSizeInBytes);
    setTotalBits(totalBits);
    setIndexBits(indexBits);
    setOffsetBits(offsetBits);

    const pageMapEntries: PageMap[] = [];
    for (let i = 0; i < Math.pow(2, indexBits); i++) {
      pageMapEntries.push(
        new PageMap(Math.pow(2, indexBits) - 1 - i, 0, false)
      );
    }
    setPageEntries(pageMapEntries);
    setPresentBits(Array(Math.pow(2, indexBits)).fill(0));
    setArrivalOrders([]);
    setNoOfPageFaults(0);
    setStep("present_bits");
  };

  //Handling present and absent bits in the present column in the table.
  const submitPresentAndAbsentBits = () => {
    const presentBitCount = presentBits.reduce((sum, bit) => sum + bit, 0);
    const maxPresentBitValue = Math.pow(2, indexBits - 1);

    if (maxPresentBitValue !== presentBitCount) {
      let errTxt = `Please select only ${maxPresentBitValue} present bits to be 1.`;
      setAlert(errTxt);
      toast.error(errTxt);
      return;
    }

    setAlert("");
    setStep("physical_bits");
  };

  //Updating the present bits according to table if the user changes frequently
  const updatePresentBits = (index: number, value: number) => {
    const newPresentBitArr = [...presentBits];
    newPresentBitArr[index] = value;
    setPresentBits(newPresentBitArr);

    const newPageEntries = [...pageEntries];
    newPageEntries[index].present = value === 1;
    setPageEntries(newPageEntries);
  };

  //Resetting the whole application
  const resetApp = () => {
    setStep("config");
    setPageEntries([]);
    setArrivalOrders([]);
    setPresentBits([]);
    setOutputResultAddress("");
    setOutputResultAddress(null);
    setHighlightedPage(null);
    setAlert("");
    setNoOfPageFaults(0);
  };
  //Handling the physical page indexes
  const submitPhysicalBits = () => {
    const physicalIndices = pageEntries
      .filter((entry) => entry.present)
      .map((entry) => entry.physicalIndex);

    const hasDuplicates =
      new Set(physicalIndices).size !== physicalIndices.length;
    const maxPhysicalBitValue = Math.pow(2, indexBits - 1);
    const hasInvalidValue = physicalIndices.some(
      (index) => index >= maxPhysicalBitValue || index < 0
    );

    if (hasDuplicates || hasInvalidValue) {
      let errTxt = `Physical page indexes should be in between 0 and ${
        maxPhysicalBitValue - 1
      } with no duplicates.`;
      setAlert(errTxt);
      toast.error(errTxt);
      return;
    }

    setAlert("");
    setStep("page_replacement");
  };

  //Handling the changing of the physical page indexs if user changes it frequently
  const updatePhysicalIndexes = (index: number, value: number) => {
    const newPageEntries = [...pageEntries];
    newPageEntries[index].physicalIndex = value;
    setPageEntries(newPageEntries);
  };

  //Handling the arrival orders submission for the FIFO page replacement if page fault happens
  const submitArrivalOrders = () => {
    if (arrivalOrders.length === 0) {
      let errTxt = "Please add at least one page to the queue.";
      setAlert(errTxt);
      toast.error(errTxt);
      return;
    }

    setAlert("");
    setStep("convert");
  };

  //Handling updating and removing the pages from the queue
  const addToQueue = (pageIdx: number) => {
    // Check if the page is already in the queue
    if (arrivalOrders.includes(pageIdx)) {
      let errTxt = "This page is already in the arrival queue.";
      setAlert(errTxt);
      toast.error(errTxt);
      return;
    }

    setArrivalOrders([...arrivalOrders, pageIdx]);
    setAlert("");
  };

  const removeFromQueue = (idx: number) => {
    const newArrivalOrder = [...arrivalOrders];
    newArrivalOrder.splice(idx, 1);
    setArrivalOrders(newArrivalOrder);
  };

  const moveUpInQueue = (index: number) => {
    if (index === arrivalOrders.length - 1) return;

    const newArrivalOrder = [...arrivalOrders];
    const temp = newArrivalOrder[index];
    newArrivalOrder[index] = newArrivalOrder[index + 1];
    newArrivalOrder[index + 1] = temp;
    setArrivalOrders(newArrivalOrder);
  };

  const moveDownInQueue = (index: number) => {
    if (index === 0) return; // Already at the beginning (oldest)

    const newArrivalOrder = [...arrivalOrders];
    const temp = newArrivalOrder[index];
    newArrivalOrder[index] = newArrivalOrder[index - 1];
    newArrivalOrder[index - 1] = temp;
    setArrivalOrders(newArrivalOrder);
  };

  const handlePageFault = (pageIndex: number, offsetBinary: string) => {
    const newPageEntries = [...pageEntries];
    const newArrivalOrders = [...arrivalOrders];

    const availablePhysicalIndexes = pageEntries.filter(
      (e) => e.present
    ).length;
    const maxPhysicalPageIndexes = Math.pow(2, indexBits - 1);

    let physicalIdx;
    let replacedPg: number | null = null;
    if (availablePhysicalIndexes < maxPhysicalPageIndexes) {
      physicalIdx = availablePhysicalIndexes;
    } else {
      if (!arrivalOrders.length) {
        return {
          status: "error",
          outputBinary: "",
          outputHex: "",
          message: "Arrival queue is empty - cannot handle page fault",
        };
      }

      replacedPg = newArrivalOrders.shift()!;
      const oldEntry = newPageEntries.find(
        (e) => e.virtualIndex === replacedPg
      );

      if (!oldEntry) {
        return {
          status: "error",
          outputBinary: "",
          outputHex: "",
          message: "Error finding page to replace",
        };
      }

      physicalIdx = oldEntry.physicalIndex;
      oldEntry.present = false;
    }

    const entry = newPageEntries.find((e) => e.virtualIndex === pageIndex);
    if (!entry) {
      return {
        status: "error",
        outputBinary: "",
        outputHex: "",
        message: "Error finding virtual page!",
      };
    }
    entry.present = true;
    entry.physicalIndex = physicalIdx;
    newArrivalOrders.push(pageIndex);

    setPageEntries(newPageEntries);
    setArrivalOrders(newArrivalOrders);
    setNoOfPageFaults(noOfPageFaults + 1);

    const physicalIdxInBinary = decToBits(physicalIdx, indexBits - 1);
    const physicalAddress = physicalIdxInBinary + offsetBinary;

    return {
      status: "page_fault",
      outputBinary: formatBinary(physicalAddress),
      outputHex: Number.parseInt(physicalAddress, 2)
        .toString(16)
        .padStart(Math.ceil(totalBits / 4), "0"),
      message:
        replacedPg !== null
          ? `Page fault handled: Replaced page ${decToBits(
              replacedPg,
              indexBits
            )} with page ${decToBits(pageIndex, indexBits)}`
          : `Page fault handled: Loaded page ${decToBits(
              pageIndex,
              indexBits
            )} into frame ${physicalIdx}`,
      replacedPage:
        replacedPg !== null ? decToBits(replacedPg, indexBits) : null,
      newPage: decToBits(pageIndex, indexBits),
      physicalFrame: physicalIdx,
    };
  };

  const physicalToVirtual = (input: string) => {
    const indexBinary =
      indexBits - 1 === 0
        ? input.substring(0, indexBits + 1)
        : input.substring(0, indexBits - 1);
    const offsetBinary = input.substring(indexBits - 1);
    const physicalIndex = Number.parseInt(indexBinary, 2);

    const entry = pageEntries.find(
      (e) => e.physicalIndex === physicalIndex && e.present
    );
    if (entry) {
      const rowIndex = pageEntries.findIndex(
        (e) => e.virtualIndex === entry.virtualIndex
      );
      setHighlightedPage(pageEntries.length - 1 - rowIndex);

      const virtualIndexBinary = decToBits(entry.virtualIndex, indexBits);
      const virtualAddress = virtualIndexBinary + offsetBinary;

      return {
        status: "success",
        outputBinary: formatBinary(virtualAddress),
        outputHex: Number.parseInt(virtualAddress, 2)
          .toString(16)
          .padStart(Math.ceil(totalBits / 4), "0")
          .toUpperCase(),
        message: "Memory address conversion successful!",
      };
    } else {
      const maxPhysicalIndex = Math.pow(2, indexBits - 1) - 1;
      if (physicalIndex > maxPhysicalIndex) {
        return {
          status: "error",
          outputBinary: "",
          outputHex: "",
          message: `Invalid physical page index: ${
            physicalIndex - 1
          }. Maximum is ${maxPhysicalIndex}.`,
        };
      }
      return {
        status: "unmapped",
        outputBinary: "",
        outputHex: "",
        message: `Physical index ${physicalIndex} is not mapped to any virtual page index.`,
        physicalFrame: physicalIndex,
      };
    }
  };

  const virtualToPhysical = (input: string) => {
    const indexInBinary = input.substring(0, indexBits);
    const offsetInBinary = input.substring(indexBits);

    const virtualPgIdx = Number.parseInt(indexInBinary, 2);
    setHighlightedPage(virtualPgIdx);

    //Find the page entry in the page table
    const pageEntry = pageEntries.find(
      (entry) => entry.virtualIndex === virtualPgIdx
    );

    //Check if the page hits or not
    if (pageEntry && pageEntry?.present) {
      const physicalIndexBinary = decToBits(
        pageEntry.physicalIndex,
        indexBits - 1
      );
      const physicalAddress = physicalIndexBinary + offsetInBinary;

      return {
        status: "success",
        outputBinary: formatBinary(physicalAddress),
        outputHex: Number.parseInt(physicalAddress, 2)
          .toString(16)
          .padStart(Math.ceil(totalBits / 4), "0")
          .toUpperCase(),
        message: "Memory address conversion successful!",
      };
    } else {
      return handlePageFault(virtualPgIdx, offsetInBinary);
    }
  };

  // Handle Address Conversion
  const convertAddress = () => {
    if (!inputHexAddress) {
      let errTxt = `Please enter a hex number in order to convert.`;
      setAlert(errTxt);
      toast.error(errTxt);
      return;
    }

    // Validate hex input
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(inputHexAddress)) {
      let errTxt = `Please enter valid hex digits 0-9, a-f, or A-F.`;
      setAlert(errTxt);
      toast.error(errTxt);
      return;
    }

    const convertingAddressInDecimal = Number.parseInt(inputHexAddress, 16);
    if (conversionMode === "v2p") {
      const maxVirAddr = Math.pow(2, totalBits) - 1;
      if (convertingAddressInDecimal > maxVirAddr) {
        let errTxt = `Invalid address:You entered address ${inputHexAddress} which exceeds maximum virtual address ${maxVirAddr
          .toString(16)
          .toUpperCase()}`;
        setAlert(errTxt);
        toast.error(errTxt);
        setInputHexAddress("");
        return;
      }
    } else if (conversionMode === "p2v") {
      const maxPhyAddr = Math.pow(2, totalBits - 1) - 1;
      if (convertingAddressInDecimal > maxPhyAddr) {
        let errTxt = `Invalid address:You entered address ${inputHexAddress} which exceeds maximum physical address ${maxPhyAddr
          .toString(16)
          .toUpperCase()}`;
        setAlert(errTxt);
        toast.error(errTxt);
        setInputHexAddress("");
        return;
      }
    }

    // Convert hex to binary
    let binaryInput = "";
    for (let i = 0; i < inputHexAddress.length; i++) {
      binaryInput += hexToBits(inputHexAddress[i]);
    }

    // Check if input is too large
    const bitCount = binaryInput.length;
    if (4 <= bitCount - totalBits || bitCount - totalBits < 0) {
      let errTxt = `Please use a hex number of ${Math.ceil(
        totalBits / 4
      )} digits.`;
      setAlert(errTxt);
      toast.error(errTxt);
      return;
    }

    if (totalBits < 4) {
      let errTxt = `Please use a larger hex number.`;
      setAlert(errTxt);
      toast.error(errTxt);
      return;
    }

    if (conversionMode === "v2p") {
      if (binaryInput.length > totalBits) {
        binaryInput = binaryInput.slice(binaryInput.length - totalBits);
      } else if (binaryInput.length < totalBits) {
        binaryInput = binaryInput.padStart(totalBits, "0");
      }
    } else if (conversionMode === "p2v") {
      const phyBits = totalBits - 1;
      if (binaryInput.length > phyBits) {
        const extra_bits = binaryInput.slice(0, binaryInput.length - phyBits);
        if (extra_bits.includes("1")) {
          let errTxt = `Your address ${inputHexAddress} exceeds maximum physical address`;
          setAlert(errTxt);
          toast.error(errTxt);
          return;
        }
        binaryInput = binaryInput.slice(binaryInput.length - phyBits);
      } else if (binaryInput.length < phyBits) {
        binaryInput = binaryInput.padStart(phyBits, "0");
      }
    }

    // Create formatted binary input for display
    const formattedBinaryInput = formatBinary(binaryInput);

    let result;

    if (conversionMode === "v2p") {
      result = virtualToPhysical(binaryInput);
    } else {
      result = physicalToVirtual(binaryInput);
    }
    console.log(inputHexAddress);
    setOutputResultAddress({
      inputHex: inputHexAddress,
      inputBinary: formattedBinaryInput,
      ...result,
    });

    setAlert("");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8 bg-slate-100">
        <CardHeader className=" rounded-t-xl py-2">
          <CardTitle className="flex justify-center items-center gap-2 text-xl text-center">
            <Microchip />
            Memory Address Conversion with paging if page fault occurs
          </CardTitle>
        </CardHeader>
      </Card>
      <div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Memory configuration part */}
        <Card>
          <CardHeader>
            <CardTitle>Memory Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <ControlPanel
              step={step}
              virtualMemSize={virtualMemSize}
              pageSize={pageSize}
              conversionMode={conversionMode}
              createInitConfiguration={createInitialConfiguration}
              setConversionMode={setConversionMode}
              setPageSize={setPageSize}
              setVirtualMemSize={setVirtualMemSize}
              submitPresentBits={submitPresentAndAbsentBits}
              resetApp={resetApp}
              submitPhysicalBits={submitPhysicalBits}
              submitArrivalOrders={submitArrivalOrders}
            />

            {step === "convert" && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Address Conversion</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputHexAddress}
                    onChange={(e) => setInputHexAddress(e.target.value)}
                    placeholder="Enter hex number"
                    className="border p-2 rounded flex-1"
                  />
                  <Button onClick={convertAddress}>Convert</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Memory Information section starts here*/}
        {step !== "config" && (
          <Card>
            <CardHeader>
              <CardTitle>Memory Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>Virtual Size:</strong> {virtualMemSize} KB (
                    {virtualMemSize * 1024} bytes)
                  </p>
                  <p>
                    <strong>Page Size:</strong> {pageSize} KB ({pageSize * 1024}{" "}
                    bytes)
                  </p>
                  <p>
                    <strong>Physical Size:</strong> {physicalMemSize / 1024} KB
                    ({physicalMemSize} bytes)
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Total Bits:</strong> {totalBits}
                  </p>
                  <p>
                    <strong>Index Bits:</strong> {indexBits}
                  </p>
                  <p>
                    <strong>Offset Bits:</strong> {offsetBits}
                  </p>
                  {step === "convert" && (
                    <p>
                      <strong>Page Faults:</strong> {noOfPageFaults}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Memory Information section ends here*/}

        {/*Page Table starts here */}
        {step !== "config" && (
          <Card className="mt-6 col-span-2">
            <CardHeader>
              <CardTitle>Page Table</CardTitle>
            </CardHeader>
            <CardContent>
              <PageTable
                step={step}
                indexBits={indexBits}
                pageMappingEntries={pageEntries}
                presentBits={presentBits}
                conversionMode={conversionMode}
                updatePresentBits={updatePresentBits}
                updatePhysicalIndexes={updatePhysicalIndexes}
                highlightedPage={highlightedPage}
              />
            </CardContent>
          </Card>
        )}

        {/*Page Table ends here */}

        {/* Page replacement with FIFO order setup starts here */}
        {step === "page_replacement" && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Arrival Orders Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <QueueManager
                pageEntries={pageEntries}
                queue={arrivalOrders}
                indexBits={indexBits}
                addToQueue={addToQueue}
                moveDownInQueue={moveDownInQueue}
                moveUpInQueue={moveUpInQueue}
                removeFromQueue={removeFromQueue}
              />
            </CardContent>
          </Card>
        )}

        {/* Page replacement with FIFO order setup ends here */}

        {/* Conversion result starts here */}
        {outputResultAddress && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Conversion Result</CardTitle>
            </CardHeader>
            <CardContent>
              {conversionMode === "p2v" && (
                <Alert className="mb-4 bg-indigo-100">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-indigo-900">
                    When converting from physical to virtual addresses, page
                    fault handling with FIFO doesn't apply. A physical frame
                    either has a virtual page mapped to it or it doesn't.
                  </AlertDescription>
                </Alert>
              )}
              <Result
                result={outputResultAddress}
                conversionMode={conversionMode}
                indexBits={indexBits}
              />
            </CardContent>
          </Card>
        )}

        {/* Conversion result ends here */}

        {/* FIFO page starts here */}
        {step === "convert" && arrivalOrders.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Arrival Orders (Oldest to Latest)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {arrivalOrders.map((pgIdx, i) => (
                  <div
                    key={pgIdx}
                    className="p-2 bg-gray-100 rounded flex items-center border border-gray-300"
                  >
                    <span className="font-mono">
                      Page {decToBits(pgIdx, indexBits)}
                    </span>
                    {i === 0 && (
                      <span className="ml-2 text-xs bg-amber-200 px-1 rounded">
                        Oldest in queue
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* FIFO page ends here */}
      </div>
    </div>
  );
}
