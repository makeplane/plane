export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Plane Admin
          </h1>
          <p className="text-gray-600 mb-6">
            Welcome to the Plane Admin Dashboard
          </p>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 text-sm">
                ✅ Admin app is successfully deployed on Vercel!
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800 text-sm">
                🚀 Next.js build completed successfully
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
