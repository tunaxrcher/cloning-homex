"use client";
import { Navbar, NavbarContent, NavbarItem } from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Menu, ChevronLeft, ChevronRight, Bell, Search } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { NavbarProps } from "@/lib/type";
import { Avatar } from "@heroui/avatar";
import { Input } from "@heroui/input";
import { linkUserTemp } from "@/lib/setting_data";
import { useSession } from "next-auth/react";
import { handleSignOut } from "@/lib/actions/actionAuths";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";

export const HomexNavbar = ({
  onMenuClick,
  onToggleCollapse,
  isCollapsed,
}: NavbarProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const session = useSession();
  const img_user = session.data?.user.avatarUrl?.toString();
  const user = session.data?.user.displayName?.toString();

  // console.log(session);

  const onLogoutConfirm = () => {
    handleSignOut();
  };

  return (
    <Navbar
      isBordered
      maxWidth="full"
      // 🌟 1. ลบคำสั่ง max-w-[100vw] ออก ให้ Navbar กาง 100% ตามธรรมชาติ
      className="bg-background/70 backdrop-blur-xl border-b-small border-default-100 sticky top-0 z-30"
      classNames={{
        // 🌟 2. บังคับ w-full และ !max-w-full เพื่อเจาะทะลุขีดจำกัดความกว้างของ HeroUI
        wrapper: "w-full !max-w-full px-4 sm:px-6 h-16",
      }}
    >
      <NavbarContent justify="start" className="gap-2 flex-1 min-w-0">
        <Button
          isIconOnly
          variant="light"
          radius="full"
          className="md:hidden text-default-500 shrink-0"
          onPress={onMenuClick}
        >
          <Menu size={24} />
        </Button>

        <Button
          isIconOnly
          variant="light"
          radius="full"
          className="hidden md:flex text-default-500 hover:text-foreground shrink-0"
          onPress={onToggleCollapse}
        >
          {isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
        </Button>

        <Input
          id="search-bar"
          classNames={{
            base: "max-w-full sm:max-w-[12rem] h-10 ml-2 hidden sm:flex flex-1 min-w-0",
            mainWrapper: "h-full w-full",
            input: "text-small w-full",
            inputWrapper:
              "h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20 rounded-full",
          }}
          placeholder="Type to search..."
          size="sm"
          startContent={<Search size={18} className="shrink-0" />}
          type="search"
        />
      </NavbarContent>

      <NavbarContent justify="end" className="gap-3 shrink-0">
        <NavbarItem className="hidden sm:flex">
          <Button
            isIconOnly
            radius="full"
            variant="light"
            className="text-default-500"
          >
            <Bell size={20} />
          </Button>
        </NavbarItem>

        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>

        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform hover:scale-105 ring-2 ring-offset-2 ring-primary/30"
                size="sm"
                src={img_user || linkUserTemp[0]?.path}
              />
            </DropdownTrigger>

            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem
                key="profile"
                isReadOnly
                className="h-14 gap-2 opacity-100 cursor-default data-[hover=true]:bg-transparent"
              >
                <p className="font-semibold">เข้าสู่ระบบโดย</p>
                <p className="font-semibold truncate max-w-[200px]">{user}</p>
              </DropdownItem>
              <DropdownItem key="settings">การตั้งค่า</DropdownItem>
              <DropdownItem key="help_and_feedback">ความช่วยเหลือ</DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                className="text-danger"
                onPress={onOpen}
              >
                ออกจากระบบ
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            isDismissable={false}
            backdrop="blur"
            className="mx-4 sm:mx-0"
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
                        onLogoutConfirm();
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
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};
