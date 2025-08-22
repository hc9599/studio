
'use server';

import { ai } from '@/ai/genkit';
import { gatePassSchema } from '@/lib/types';
import { z } from 'zod';

const shareGatePassInputSchema = z.object({
  gatePass: gatePassSchema.extend({
      visitorName: z.string(),
      flatNumber: z.string(),
  }),
  shareMethod: z.enum(['email', 'sms']),
  contactInfo: z.string(),
});

type ShareGatePassInput = z.infer<typeof shareGatePassInputSchema>;

const shareGatePassOutputSchema = z.object({
  message: z.string().describe('The formatted message to be sent to the guest.'),
});

type ShareGatePassOutput = z.infer<typeof shareGatePassOutputSchema>;

const shareGatePassFlow = ai.defineFlow(
  {
    name: 'shareGatePassFlow',
    inputSchema: shareGatePassInputSchema,
    outputSchema: shareGatePassOutputSchema,
  },
  async (input) => {
    const { gatePass, shareMethod } = input;

    const prompt = `
        You are a helpful assistant for a residential society's gate management system.
        Your task is to generate a message to be sent to a guest containing their gate pass information.

        The message should be formatted for the following method: ${shareMethod}.
        If it's an email, it should have a clear subject line and a polite body.
        If it's an SMS, it should be concise and clear.

        Gate Pass Details:
        - Guest Name: ${gatePass.visitorName}
        - Visiting Flat: ${gatePass.flatNumber}
        - Unique Code: ${gatePass.qrData}
        - Instructions from resident: "${gatePass.instructions}"

        Generate a JSON object with a single field "message" containing the text to be sent.
    `;

    const llmResponse = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.0-flash',
      output: {
        schema: shareGatePassOutputSchema,
      },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('Failed to generate sharing message from AI.');
    }

    // In a real app, you would integrate with an email/SMS service like Twilio or SendGrid here.
    // For this demo, we will just return the generated message.
    console.log(`Simulating sending message to ${input.contactInfo} via ${input.shareMethod}`);
    console.log(`Message: \n${output.message}`);

    return output;
  }
);


export async function shareGatePass(input: ShareGatePassInput): Promise<ShareGatePassOutput> {
    return await shareGatePassFlow(input);
}
