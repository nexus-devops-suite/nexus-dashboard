import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Auth code is missing' });
  }

  // Simulate exchanges of oauth code for user session token
  console.log(`OAuth code ${code} exchanged successfully with state ${state}`);

  // Redirect to dashboard onboarding dashboard main screen
  res.redirect('/dashboard');
}
