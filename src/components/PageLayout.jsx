import Navbar from './Navbar';
import Footer from './Footer';

export default function PageLayout({ children }) {
  return (
    <div className="page-layout">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
