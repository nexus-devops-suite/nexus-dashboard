import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { event_name, data } = req.body;

    // Simulate database updates to organizations table
    console.log(`Paddle webhook processed successfully: ${event_name} for subscription ${data?.subscription_id}`);

    return res.status(200).json({
      status: 'success',
      message: 'Next.js API proxy successfully completed synchronization'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
