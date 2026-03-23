import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import CustomerForm from "./pages/CustomerForm";
import CustomerList from "./pages/CustomerList";
import Prepare from "./pages/Prepare";
import LiveSession from "./pages/LiveSession";
import "./App.css";

function NavBar() {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">クロージング支援ツール</Link>
      <div className="nav-links">
        <Link to="/" className={isActive("/")}>顧客一覧</Link>
        <Link to="/register" className={isActive("/register")}>顧客登録</Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<CustomerList />} />
          <Route path="/register" element={<CustomerForm />} />
          <Route path="/edit/:id" element={<CustomerForm />} />
          <Route path="/prepare/:id" element={<Prepare />} />
          <Route path="/session/:id" element={<LiveSession />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
