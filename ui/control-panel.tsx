"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ControlPanelProps {
  step: string;
  virtualMemSize: number;
  pageSize: number;
  conversionMode: string;
  setVirtualMemSize: (size: number) => void;
  setPageSize: (size: number) => void;
  setConversionMode: (mode: string) => void;
  createInitConfiguration: () => void;
  submitPresentBits: () => void;
  resetApp: () => void;
  submitPhysicalBits: () => void;
  submitArrivalOrders: () => void;
}

const ControlPanel = ({
  step,
  virtualMemSize,
  pageSize,
  conversionMode,
  setVirtualMemSize,
  setPageSize,
  setConversionMode,
  createInitConfiguration,
  submitPresentBits,
  resetApp,
  submitPhysicalBits,
  submitArrivalOrders,
}: ControlPanelProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vir_size">Virtual Memory Size (KB)</Label>
          <Input
            id="vir_size"
            type="number"
            min={1}
            value={virtualMemSize}
            onChange={(e) => setVirtualMemSize(Number.parseInt(e.target.value))}
            disabled={step !== "config"}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="page_size">Page Size (KB)</Label>
          <Input
            id="page_size"
            type="number"
            min={1}
            value={pageSize}
            onChange={(e) => setPageSize(Number.parseInt(e.target.value))}
            disabled={step !== "config"}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="selectMode">Conversion Mode</Label>
        <Select
          value={conversionMode}
          onValueChange={setConversionMode}
          disabled={step !== "config"}
        >
          <SelectTrigger id="selectMode">
            <SelectValue placeholder="Select Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="v2p">Virtual to Physical</SelectItem>
            <SelectItem value="p2v">Physical to Virtual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {step === "config" && (
          <Button onClick={createInitConfiguration}>Create Memory Map</Button>
        )}

        {step === "present_bits" && (
          <Button onClick={submitPresentBits}>Submit Present Bits</Button>
        )}

        {step === "physical_bits" && (
          <Button onClick={submitPhysicalBits}>Submit Physical Bits</Button>
        )}

        {step === "page_replacement" && (
          <Button onClick={submitArrivalOrders}>Submit Arrival Orders</Button>
        )}

        {step !== "config" && (
          <Button variant="outline" onClick={resetApp}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
