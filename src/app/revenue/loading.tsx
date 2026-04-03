export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="h-4 w-24 bg-gray-800 rounded animate-pulse mx-auto mb-4" />
          <div className="h-10 w-48 bg-gray-800 rounded animate-pulse mx-auto mb-3" />
          <div className="h-5 w-96 bg-gray-800 rounded animate-pulse mx-auto" />
        </div>
        <div className="max-w-lg mx-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="h-4 w-32 bg-gray-800 rounded animate-pulse mb-3" />
            <div className="h-12 w-full bg-gray-800 rounded-lg animate-pulse mb-4" />
            <div className="h-12 w-full bg-gray-800 rounded-lg animate-pulse mb-6" />
            <div className="h-px bg-gray-700 mb-6" />
            <div className="h-12 w-full bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
