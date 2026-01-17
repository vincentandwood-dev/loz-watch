import Map from '@/components/Map';

// Force dynamic rendering to avoid SSR issues with Leaflet
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <Map />
    </main>
  );
}

