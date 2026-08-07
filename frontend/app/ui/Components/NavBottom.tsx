import NavLinks from "./Nav-links"

export default function NavBottom() {
    return (
        <>
            <div className="fixed bottom-0 inset-x-0 z-50 md:hidden
                bg-gradient-to-r from-[#9b99b5] via-[#a2a3bf] to-[#a09cbb] px-1 py-4
                flex items-center justify-between gap-1
                rounded-tl-[20px] rounded-tr-[20px]
                overflow-hidden">

                <NavLinks layoutId="activeTabBackgroundMobile" />
            </div>
        </>
    );
}