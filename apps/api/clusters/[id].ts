import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    // Return mock cluster information
    return res.status(200).json({
      cluster_id: id,
      name: `Production Cluster ${id}`,
      nodes_count: 5,
      status: 'active',
      location: 'us-east-1'
    });
  }

  if (req.method === 'DELETE') {
    // Simulate removing from database
    return res.status(200).json({
      message: `Cluster ${id} deleted successfully`
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
