export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container-custom py-6">
        <p className="text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} Retrievo. Find it. Return it.
        </p>
      </div>
    </footer>
  );
};
