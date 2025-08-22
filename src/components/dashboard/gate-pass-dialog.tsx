
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, QrCode, Clipboard, Mail, Phone, Send } from 'lucide-react';
import type { z } from 'zod';
import type { gatePassSchema } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { useState } from 'react';
import { shareGatePassAction } from '@/app/actions';

type GatePassData = z.infer<typeof gatePassSchema> & { visitorName: string; flatNumber: string };

type GatePassDialogProps = {
  gatePassData: GatePassData | null;
  setGatePassData: (data: GatePassData | null) => void;
};

export function GatePassDialog({ gatePassData, setGatePassData }: GatePassDialogProps) {
    const { toast } = useToast();
    const [shareVia, setShareVia] = useState('email');
    const [contactInfo, setContactInfo] = useState('');
    const [isSending, setIsSending] = useState(false);

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

    const handleShare = async () => {
        if(!gatePassData || !contactInfo) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter contact information.' });
            return;
        }
        setIsSending(true);
        const result = await shareGatePassAction({
            gatePass: gatePassData,
            shareMethod: shareVia as 'email' | 'sms',
            contactInfo: contactInfo,
        });

        if (result.success) {
            toast({ 
                title: 'Share Simulation',
                description: (
                    <div className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 text-white">
                        <p className="text-sm font-medium">Message sent to {contactInfo} via {shareVia}:</p>
                        <pre className="mt-2 w-full text-wrap text-xs">{result.message}</pre>
                    </div>
                ),
                duration: 8000,
             });
            setContactInfo('');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to send gate pass.' });
        }
        setIsSending(false);
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
        <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium text-center">Share with Guest (Simulation)</h3>
            <Tabs value={shareVia} onValueChange={setShareVia} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4" />Email</TabsTrigger>
                    <TabsTrigger value="sms"><Phone className="mr-2 h-4 w-4" />SMS</TabsTrigger>
                </TabsList>
                <TabsContent value="email" className="mt-4">
                    <div className="flex gap-2">
                        <Input type="email" placeholder="guest@example.com" value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
                        <Button onClick={handleShare} disabled={isSending}><Send className="h-4 w-4" /></Button>
                    </div>
                </TabsContent>
                <TabsContent value="sms" className="mt-4">
                     <div className="flex gap-2">
                        <Input type="tel" placeholder="Phone number" value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
                        <Button onClick={handleShare} disabled={isSending}><Send className="h-4 w-4" /></Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>

      </DialogContent>
    </Dialog>
  );
}
