import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  return NextResponse.json({
    cluster_id: id,
    name: `Production Cluster ${id}`,
    nodes_count: 5,
    status: 'active',
    location: 'us-east-1'
  });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  return NextResponse.json({
    message: `Cluster ${id} deleted successfully`
  });
}
