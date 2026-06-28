import { useState } from 'react';
import Sidebar, { MobileMenuButton } from './Sidebar';

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="main-content">
        <MobileMenuButton onClick={() => setMobileOpen(true)} />
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
