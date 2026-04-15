import { TicketProvider } from "./context/TicketContext";
import TicketParserPage from "./pages/TicketParserPage";

export default function App() {
  return (
    <TicketProvider>
      <TicketParserPage />
    </TicketProvider>
  );
}