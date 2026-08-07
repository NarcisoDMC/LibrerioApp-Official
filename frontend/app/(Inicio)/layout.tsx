import { Geist, Geist_Mono} from "next/font/google";
import Navbar from "@/app/ui/Components/Navbar";
import "swiper/css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-full flex flex-col">
            <Navbar />
            {children}
        </div>
    );
}