import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const baseURL = 'https://prod-api.kosetto.com/users/' + address;
  const response = await fetch(baseURL);
  const data = await response.json();
  return NextResponse.json(data);
}
