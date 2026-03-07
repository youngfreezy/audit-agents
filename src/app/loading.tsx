export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="h-10 w-64 bg-gray-800 rounded-lg mx-auto mb-3 animate-pulse" />
          <div className="h-6 w-96 bg-gray-800 rounded-lg mx-auto animate-pulse" />
        </div>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-12 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-12 bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
