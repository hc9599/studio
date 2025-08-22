
'use server';

import { ai } from '@/ai/genkit';
import { gatePassInputSchema, gatePassSchema, type GatePassInput, type GatePassOutput } from '@/lib/types';

const gatePassFlow = ai.defineFlow(
  {
    name: 'gatePassFlow',
    inputSchema: gatePassInputSchema,
    outputSchema: gatePassSchema,
  },
  async ({ guestName, purpose, flatNumber }) => {
    const prompt = `
      You are a security system for a residential society. Generate the contents for a digital gate pass.
      The pass needs to be clear for the security guard but also not reveal too much private information.

      Guest Details:
      - Name: ${guestName}
      - Visiting Flat: ${flatNumber}
      - Purpose: ${purpose}

      Based on these details, generate a JSON object with the following fields:
      1.  'displayInfo': An array of strings with the most essential information for the security guard. Must include guest name and flat number.
      2.  'qrData': A unique, secure, and random 8-character alphanumeric code for this pass.
      3.  'instructions': A short, polite instruction for the guest on how to use the pass. For example: "Show this pass at the gate for entry."

      Do not include the purpose of the visit in the final output to maintain resident privacy.
    `;

    const llmResponse = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.0-flash',
      output: {
        schema: gatePassSchema,
      },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('Failed to generate gate pass from AI.');
    }

    return output;
  }
);

export async function generateGatePass(input: GatePassInput): Promise<GatePassOutput> {
    return await gatePassFlow(input);
}
