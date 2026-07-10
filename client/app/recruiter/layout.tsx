import ProtectedRoute from "@/components/ProtectedRoute";

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["mentor", "admin"]} fallbackPath="/dashboard">
      {children}
    </ProtectedRoute>
  );
}
