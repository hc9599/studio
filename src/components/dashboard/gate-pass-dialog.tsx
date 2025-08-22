
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, QrCode, Clipboard } from 'lucide-react';
import type { z } from 'zod';
import type { gatePassSchema } from '@/ai/flows/gatePass';
import { useToast } from '@/hooks/use-toast';

type GatePassData = z.infer<typeof gatePassSchema> & { visitorName: string; flatNumber: string };

type GatePassDialogProps = {
  gatePassData: GatePassData | null;
  setGatePassData: (data: GatePassData | null) => void;
};

export function GatePassDialog({ gatePassData, setGatePassData }: GatePassDialogProps) {
    const { toast } = useToast();

    const handleCopy = () => {
        if(!gatePassData) return;
        const passDetails = `
            Guest: ${gatePassData.visitorName}\n
            Flat: ${gatePassData.flatNumber}\n
            Code: ${gatePassData.qrData}\n
            Instructions: ${gatePassData.instructions}
        `;
        navigator.clipboard.writeText(passDetails.trim());
        toast({ title: 'Copied to clipboard!' });
    }

  return (
    <Dialog open={!!gatePassData} onOpenChange={(open) => !open && setGatePassData(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <CheckCircle className="h-6 w-6 mr-2 text-green-500" />
            Gate Pass Generated!
          </DialogTitle>
          <DialogDescription>
            Share this with your guest for a smooth entry.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 space-y-4 rounded-lg border p-4 text-center">
            <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                    <QrCode className="h-32 w-32" />
                </div>
            </div>
            <p className="text-sm text-muted-foreground">Unique Code</p>
            <p className="text-3xl font-bold tracking-widest bg-muted rounded-md py-2">{gatePassData?.qrData}</p>
            
            <div className="text-left space-y-2 pt-4">
                {gatePassData?.displayInfo.map((info, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-muted-foreground">{info.split(':')[0]}:</span>
                        <span className="font-semibold">{info.split(':')[1]}</span>
                    </div>
                ))}
            </div>
        </div>
        <p className="text-center text-sm text-muted-foreground italic">
            "{gatePassData?.instructions}"
        </p>
        <Button onClick={handleCopy} className="w-full">
            <Clipboard className="mr-2 h-4 w-4" />
            Copy Details
        </Button>
      </DialogContent>
    </Dialog>
  );
}
