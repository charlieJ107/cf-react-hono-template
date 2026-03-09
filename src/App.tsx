import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/app/index";
import NotFound from "@/app/notfound";
import Messages from "@/app/messages";
import SignIn from "@/app/sign-in";
import SignUp from "@/app/sign-up";
import Dashboard from "@/app/dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
