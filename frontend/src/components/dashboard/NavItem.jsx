function NavItem({ children, icon, active }) {
  return (
    <button
      className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-colors ${
        active 
          ? "bg-purple-50 text-purple-600" 
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <span>{icon}</span>
      <span>{children}</span>
    </button>
  );
}

export default NavItem; 