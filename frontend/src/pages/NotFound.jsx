import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="text-center py-12">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
      <p className="text-gray-500 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn-primary">
        Go Home
      </Link>
    </div>
  );
};
