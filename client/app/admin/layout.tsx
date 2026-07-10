import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]} fallbackPath="/dashboard">
      <div className="flex-1 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <p className="text-sm text-muted-foreground font-medium mb-1">System Control</p>
            <h1 className="text-3xl font-black">Admin Dashboard</h1>
          </div>
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
