import { auth } from "@clerk/nextjs/server";

import { NavigationSideBar } from "@/components/navigation/navigation-sidebar";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  await auth.protect();

  return (
    <div className="h-full">
      <div className="h-full w-[72px] z-30 flex-col fixed inset-y-0 hidden md:flex">
        <NavigationSideBar />
      </div>

      <main className="md:pl-[72px] h-full">{children}</main>
    </div>
  );
};

export default MainLayout;
