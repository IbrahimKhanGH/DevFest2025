import NavItem from './NavItem';

function Sidebar({ userData }) {
  return (
    <div className="fixed w-72 h-full bg-white border-r border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {userData?.user_name?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Hi, {userData?.user_name || 'User'}! 👋
            </h2>
            <p className="text-sm text-gray-500">Welcome back</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          <NavItem icon="📊" active>Dashboard</NavItem>
          <NavItem icon="📝">Food Log</NavItem>
          <NavItem icon="📈">Progress</NavItem>
          <NavItem icon="⚙️">Settings</NavItem>
        </nav>
      </div>
    </div>
  );
}

export default Sidebar; 