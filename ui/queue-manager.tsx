"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { decToBits, PageMap } from "@/lib/utils";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useState } from "react";

interface QueueManagerProps {
  pageEntries: PageMap[];
  queue: number[];
  indexBits: number;
  addToQueue: (index: number) => void;
  removeFromQueue: (index: number) => void;
  moveUpInQueue: (index: number) => void;
  moveDownInQueue: (index: number) => void;
}

const QueueManager = ({
  pageEntries,
  queue,
  indexBits,
  addToQueue,
  removeFromQueue,
  moveUpInQueue,
  moveDownInQueue,
}: QueueManagerProps) => {
  const [currentPage, setCurrentPage] = useState<string>("");

  // Get all those pages with present bit as 1.
  const validPages = () => {
    return pageEntries
      .filter((page) => page.present)
      .map((page) => page.virtualIndex)
      .sort((a, b) => a - b);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">
          Set Initial FIFO Queue Order
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Specify the order in which pages arrived in memory. The oldest page
          (first in) will be the first to be replaced when a page fault occurs.
        </p>
        <div className="flex gap-2 mb-4">
          <Select value={currentPage} onValueChange={setCurrentPage}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a page" />
            </SelectTrigger>
            <SelectContent>
              {validPages().map((pgIdx) => (
                <SelectItem key={pgIdx} value={pgIdx.toString()}>
                  Page {decToBits(pgIdx, indexBits)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              if (currentPage) {
                addToQueue(Number(currentPage));
                setCurrentPage("");
              }
            }}
            disabled={!currentPage}
          >
            Add to Arrival Queue
          </Button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">
          Current Arrival Order (FIFO)
        </h3>

        {!queue.length ? (
          <p className="text-sm text-gray-500">
            No pages in the queue yet. Add pages to establish the replacement
            order.
          </p>
        ) : (
          <div className="space-y-2">
            {queue.map((virIdx, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-100 rounded"
              >
                <span className="font-mono flex-1">
                  {index + 1}. Page {decToBits(virIdx, indexBits)}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => moveDownInQueue(index)}
                    disabled={index === 0}
                    title="Move to earlier in queue."
                  >
                    <ArrowDown className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => moveUpInQueue(index)}
                    disabled={index === queue.length - 1}
                    title="Move to later in queue."
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeFromQueue(index)}
                    title="Remove from queue"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-amber-50 p-4 rounded-md">
        <h3 className="text-md font-medium mb-2">
          How FIFO Page Replacement Works
        </h3>
        <p className="text-sm">
          When a page fault occurs, the system will replace the oldest page in
          memory (the first one that was loaded). The order you set here
          determines which page will be replaced first.
        </p>
      </div>
    </div>
  );
};

export default QueueManager;
