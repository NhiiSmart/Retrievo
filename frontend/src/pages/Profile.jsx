import { useAuth } from '../hooks/useAuth';

export const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">Name</label>
            <p className="font-medium text-gray-900">{user?.name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Member Since</label>
            <p className="font-medium text-gray-900">
              {new Date(user?.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
