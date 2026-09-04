import Navbar from "@/app/ui/Components/navigation/Navbar";
import "swiper/css";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-full flex flex-col">
            <Navbar />
            {children}
        </div>
    );
}