"use client";

import { LogOut, X } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarProps } from "@/lib/type";
import { Tooltip } from "@heroui/tooltip";
import { Button } from "@heroui/button";
import Image from "next/image";
import { menuItems } from "@/lib/setting_data";
import { handleSignOut } from "@/lib/actions/actionAuths";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

export const HomexSidebar = ({
  isOpenSideBar,
  isCollapsed,
  setIsOpen,
}: SidebarProps) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const allowedMenuItems = useMemo(() => {
    if (status === "loading") return [];
    const userPermissions = session?.user?.permissions || [];
    return menuItems.filter((item) => {
      if (!item.permissionKey) return true;
      return userPermissions.includes(item.permissionKey);
    });
  }, [session, status]);

  const sidebarClasses = `
    fixed z-50 h-screen bg-background/90 backdrop-blur-xl border-r-small border-default-100 
    transition-all duration-300 ease-in-out shadow-xl
    ${isOpenSideBar ? "translate-x-0" : "-translate-x-full md:translate-x-0"} 
    ${isCollapsed ? "md:w-[80px]" : "md:w-[280px]"} 
    w-[280px] flex flex-col rounded-r-3xl
  `;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden
        ${isOpenSideBar ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={sidebarClasses}>
        <div
          className={`h-20 flex items-center px-6 md:px-0 ${
            isCollapsed ? "md:justify-center" : "justify-between md:px-6"
          }`}
        >
          <div className={`${isCollapsed ? "hidden md:block" : "block"}`}>
            {isCollapsed ? (
              <Image
                src="/logo.png"
                alt="HOMEX Logo"
                width={40}
                height={40}
                className="rounded-full object-cover dark:invert font-sans"
              />
            ) : (
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="HOMEX Logo"
                  width={32}
                  height={32}
                  className="rounded-full object-cover dark:invert "
                />
                <span className="text-xl font-bold bg-gradient-to-tr from-slate-200 to-slate-500 text-transparent bg-clip-text tracking-wide">
                  HOMEX
                </span>
              </div>
            )}
          </div>

          <div
            className={`flex items-center gap-3 md:hidden ${isCollapsed ? "block" : "hidden"}`}
          >
            <Image
              src="/logo.png"
              alt="HOMEX Logo"
              width={32}
              height={32}
              className="rounded-full object-cover dark:invert "
            />
            <span className="text-xl font-bold bg-gradient-to-tr from-slate-200 to-slate-500 text-transparent bg-clip-text tracking-wide">
              HOMEX
            </span>
          </div>

          <Button
            isIconOnly
            variant="light"
            radius="full"
            className="md:hidden text-default-400"
            onPress={() => setIsOpen(false)}
          >
            <X size={22} />
          </Button>
        </div>

        <div className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
          {allowedMenuItems.map((item) => {
            const isActive = pathname === item.path;

            const LinkContent = (
              <Link
                href={item.path}
                className={`
                  flex items-center gap-4 p-3.5 transition-all duration-300 group relative overflow-hidden
                  rounded-full
                  ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "text-default-500 hover:bg-default-100 hover:text-foreground"
                  }
                  ${
                    isCollapsed
                      ? "md:justify-center md:aspect-square md:p-0 md:w-12 md:h-12 md:mx-auto"
                      : ""
                  }
                `}
              >
                <item.icon
                  size={isCollapsed ? 22 : 20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-transform group-hover:scale-110 z-10 ${isCollapsed ? "md:w-[22px]" : "w-[20px]"}`}
                />

                <span
                  className={`text-sm font-medium z-10 ${isCollapsed ? "block md:hidden" : "block"}`}
                >
                  {item.name}
                </span>
              </Link>
            );

            return isCollapsed ? (
              <div key={item.path} className="w-full">
                <div className="md:hidden">{LinkContent}</div>
                <Tooltip
                  key={`tooltip-${item.path}`}
                  content={item.name}
                  placement="right"
                  color="primary"
                  offset={10}
                  className="hidden md:block"
                >
                  <div className="w-full flex justify-center hidden md:flex">
                    {LinkContent}
                  </div>
                </Tooltip>
              </div>
            ) : (
              <div key={item.path}>{LinkContent}</div>
            );
          })}
        </div>

        <div
          className={`flex items-center w-full pb-6 ${
            isCollapsed ? "md:justify-center" : "px-6"
          } px-6`}
        >
          {isCollapsed ? (
            <>
              <Button
                onPress={onOpen}
                variant="flat"
                color="danger"
                radius="full"
                className="w-full justify-center gap-2 h-8 md:hidden"
                startContent={<LogOut size={16} />}
              >
                <span className="font-medium text-xs">Logout</span>
              </Button>

              <div className="hidden md:block">
                <Tooltip content="Logout" placement="right" color="danger">
                  <Button
                    onPress={onOpen}
                    isIconOnly
                    variant="flat"
                    color="danger"
                    radius="full"
                    className="w-9 h-9 min-w-9"
                  >
                    <LogOut size={16} />
                  </Button>
                </Tooltip>
              </div>
            </>
          ) : (
            <Button
              onPress={onOpen}
              variant="flat"
              color="danger"
              radius="full"
              className="w-full justify-center gap-2 h-8"
              startContent={<LogOut size={16} />}
            >
              <span className="font-medium text-xs">Logout</span>
            </Button>
          )}

          <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            isDismissable={false}
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1">
                    ยืนยันการออกจากระบบ
                  </ModalHeader>
                  <ModalBody>
                    <p>คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?</p>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="default" variant="light" onPress={onClose}>
                      ยกเลิก
                    </Button>

                    <Button
                      color="danger"
                      onPress={() => {
                        localStorage.clear();
                        handleSignOut();
                        onClose();
                      }}
                    >
                      ออกจากระบบ
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </div>
      </aside>
    </>
  );
};
